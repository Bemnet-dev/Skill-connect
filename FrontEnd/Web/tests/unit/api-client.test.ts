/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  apiClient,
  ApiError,
  isApiError,
  setAuthToken,
  setRefreshToken,
  clearAuthTokens,
  setCustomRefreshHandler,
} from "@/lib/api-client";

describe("apiClient (Centralized Fetch Pipeline)", () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    clearAuthTokens();
    setCustomRefreshHandler(null);
    mockFetch = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("Authentication Header Attachment", () => {
    it("attaches Authorization header when auth token exists", async () => {
      setAuthToken("test-jwt-token");

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await apiClient.get<{ success: boolean }>("/test-endpoint");

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toContain("/test-endpoint");
      const headers = new Headers(calledInit?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-jwt-token");
    });

    it("does not attach Authorization header if no token exists", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: "public" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await apiClient.get("/public-endpoint");

      const [, calledInit] = mockFetch.mock.calls[0];
      const headers = new Headers(calledInit?.headers);
      expect(headers.has("Authorization")).toBe(false);
    });

    it("skips Authorization header when skipAuth is true even if token exists", async () => {
      setAuthToken("test-jwt-token");

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: "skipped" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await apiClient.get("/login", { skipAuth: true });

      const [, calledInit] = mockFetch.mock.calls[0];
      const headers = new Headers(calledInit?.headers);
      expect(headers.has("Authorization")).toBe(false);
    });
  });

  describe("Silent Refresh & 401 Single Retry", () => {
    it("retries once on 401 via silent refresh and succeeds", async () => {
      setAuthToken("expired-access-token");
      setRefreshToken("valid-refresh-token");

      // 1st call: Original request returns 401 Unauthorized
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Token expired", status: 401 }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

      // 2nd call: Silent refresh call to /api/v1/auth/refresh returns 200 with new token
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: "new-fresh-access-token",
            refreshToken: "new-fresh-refresh-token",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

      // 3rd call: Retried original request returns 200 OK
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ profile: "worker-data" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const data = await apiClient.get<{ profile: string }>("/workers/me");

      expect(data).toEqual({ profile: "worker-data" });
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Check refresh call payload
      const [refreshUrl, refreshInit] = mockFetch.mock.calls[1];
      expect(refreshUrl).toContain("/api/v1/auth/refresh");
      expect(refreshInit?.method).toBe("POST");

      // Check retried call had the new token
      const [retriedUrl, retriedInit] = mockFetch.mock.calls[2];
      expect(retriedUrl).toContain("/workers/me");
      const retriedHeaders = new Headers(retriedInit?.headers);
      expect(retriedHeaders.get("Authorization")).toBe(
        "Bearer new-fresh-access-token"
      );
    });

    it("throws a typed ApiError on 401 if silent refresh fails", async () => {
      setAuthToken("expired-access-token");
      setRefreshToken("expired-refresh-token");

      // 1st call: Original request fails with 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      // 2nd call: Refresh call fails with 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Refresh token revoked" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      try {
        await apiClient.get("/account");
        throw new Error("Should have thrown ApiError");
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(401);
          expect(err.name).toBe("ApiError");
        }
      }
    });

    it("does not retry 401 more than once (prevents infinite loop)", async () => {
      setAuthToken("bad-token");
      setRefreshToken("valid-refresh-token");

      // 1st call: 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      // 2nd call: Refresh returns new token
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: "still-bad-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      // 3rd call: Retried request STILL returns 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Still unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(apiClient.get("/secret")).rejects.toThrow(ApiError);
      // Ensure exactly 3 fetch calls (1 original + 1 refresh + 1 retry, NOT 5 or infinite)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("deduplicates concurrent 401 requests to execute only one refresh call", async () => {
      setAuthToken("expired-token");
      setRefreshToken("shared-refresh-token");

      // Mock initial calls for 2 concurrent requests returning 401
      mockFetch.mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/v1/auth/refresh")) {
          // Artificial delay for refresh call
          await new Promise((r) => setTimeout(r, 20));
          return new Response(
            JSON.stringify({ accessToken: "new-shared-token" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Check if retry has the new token
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      // Override custom refresh handler to count invocations
      let refreshCount = 0;
      setCustomRefreshHandler(async () => {
        refreshCount++;
        await new Promise((r) => setTimeout(r, 20));
        return "refreshed-shared-token";
      });

      // Force 401 on initial calls
      let callCount = 0;
      mockFetch.mockImplementation(async (url) => {
        callCount++;
        if (callCount <= 2) {
          return new Response(JSON.stringify({ message: "Expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ url: String(url) }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      const [res1, res2] = await Promise.all([
        apiClient.get("/resource-1"),
        apiClient.get("/resource-2"),
      ]);

      expect(res1).toBeDefined();
      expect(res2).toBeDefined();
      // Crucial: Only 1 refresh was performed despite 2 concurrent 401s
      expect(refreshCount).toBe(1);
    });
  });

  describe("Typed ApiError on Failure", () => {
    it("throws ApiError with RFC 7807 problem details data on 400 Bad Request", async () => {
      const problemDetails = {
        type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
        title: "Validation Error",
        status: 400,
        detail: "The phone number format is invalid.",
        errors: {
          phone: ["Must start with a plus sign", "Must be E.164 format"],
        },
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(problemDetails), {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        })
      );

      try {
        await apiClient.post("/bookings", { phone: "123" });
        throw new Error("Should have thrown ApiError");
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(400);
          expect(err.statusText).toBe("Bad Request");
          expect(err.message).toBe("The phone number format is invalid.");
          expect(err.data).toEqual(problemDetails);
          expect(err.data?.errors?.phone).toHaveLength(2);
        }
      }
    });

    it("throws ApiError on 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Database connection failed", {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
        })
      );

      try {
        await apiClient.get("/jobs");
        throw new Error("Should have thrown");
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(500);
          expect(err.message).toContain("Database connection failed");
        }
      }
    });
  });

  describe("HTTP Convenience Methods & Payload Formatting", () => {
    it("serializes plain object body to JSON on POST", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 101 }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

      const payload = { title: "Plumber needed", category: "Plumbing" };
      const response = await apiClient.post<{ id: number }>("/jobs", payload);

      expect(response).toEqual({ id: 101 });
      const [, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify(payload));
      const headers = new Headers(init?.headers);
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("formats query parameters with params option", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await apiClient.get("/search", {
        params: { q: "Electrician", page: 1, available: true },
      });

      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toContain("q=Electrician");
      expect(calledUrl).toContain("page=1");
      expect(calledUrl).toContain("available=true");
    });

    it("handles PUT, PATCH, and DELETE requests", async () => {
      mockFetch.mockImplementation(
        async () =>
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
      );

      await apiClient.put("/jobs/1", { status: "Active" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PUT");

      await apiClient.patch("/jobs/1", { title: "Updated" });
      expect(mockFetch.mock.calls[1][1]?.method).toBe("PATCH");

      await apiClient.delete("/jobs/1");
      expect(mockFetch.mock.calls[2][1]?.method).toBe("DELETE");
    });

    it("handles 204 No Content gracefully", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          statusText: "No Content",
        })
      );

      const result = await apiClient.delete("/messages/12");
      expect(result).toBeUndefined();
    });
  });
});
