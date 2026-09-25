/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  apiClient,
  ApiError,
  isApiError,
  setAuthToken,
  clearAuthTokens,
  setBetterAuthClient,
  setBetterAuthTokenResolver,
} from "@/lib/api-client";

describe("apiClient (Better Auth Integrated Fetch Pipeline)", () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const mockToken = jest.fn<
    (opts?: unknown) => Promise<{ data: { token: string } | null; error: unknown }>
  >();

  beforeEach(() => {
    clearAuthTokens();
    setBetterAuthTokenResolver(null);
    mockFetch = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;

    // Attach mock Better Auth client
    mockToken.mockReset();
    mockToken.mockResolvedValue({ data: null, error: null });
    setBetterAuthClient({
      token: mockToken,
    } as never);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("Authentication Header Attachment via Better Auth", () => {
    it("asks Better Auth's client for current JWT before request and attaches Bearer header", async () => {
      // Better Auth returns a valid current JWT
      mockToken.mockResolvedValueOnce({
        data: { token: "better-auth-jwt-123" },
        error: null,
      });

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await apiClient.get<{ success: boolean }>("/test-endpoint");

      expect(result).toEqual({ success: true });
      expect(mockToken).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toContain("/test-endpoint");
      const headers = new Headers(calledInit?.headers);
      expect(headers.get("Authorization")).toBe("Bearer better-auth-jwt-123");
    });

    it("falls back to stored access token if Better Auth client does not return a token", async () => {
      setAuthToken("cached-stored-token");
      mockToken.mockResolvedValueOnce({ data: null, error: null });

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await apiClient.get("/test-endpoint");

      const [, calledInit] = mockFetch.mock.calls[0];
      const headers = new Headers(calledInit?.headers);
      expect(headers.get("Authorization")).toBe("Bearer cached-stored-token");
    });

    it("does not attach Authorization header if no token exists from Better Auth or storage", async () => {
      mockToken.mockResolvedValueOnce({ data: null, error: null });

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

    it("skips asking Better Auth and skips Authorization header when skipAuth is true", async () => {
      mockToken.mockResolvedValueOnce({
        data: { token: "should-be-skipped" },
        error: null,
      });

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: "skipped" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await apiClient.get("/login", { skipAuth: true });

      expect(mockToken).not.toHaveBeenCalled();
      const [, calledInit] = mockFetch.mock.calls[0];
      const headers = new Headers(calledInit?.headers);
      expect(headers.has("Authorization")).toBe(false);
    });

    it("preserves explicitly passed custom Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: "custom" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await apiClient.get("/endpoint", {
        headers: { Authorization: "CustomToken manual-123" },
      });

      expect(mockToken).not.toHaveBeenCalled();
      const [, calledInit] = mockFetch.mock.calls[0];
      const headers = new Headers(calledInit?.headers);
      expect(headers.get("Authorization")).toBe("CustomToken manual-123");
    });
  });

  describe("401 from C# API — Re-ask Better Auth for fresh token once, then give up", () => {
    it("on 401, re-asks Better Auth for fresh token, retries C# request once with new token, and succeeds", async () => {
      // 1. Initial request gets current token from Better Auth
      mockToken.mockResolvedValueOnce({
        data: { token: "stale-jwt-token" },
        error: null,
      });

      // 2. C# API returns 401 Unauthorized
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Token expired", status: 401 }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

      // 3. On 401: re-asks Better Auth client for fresh token
      mockToken.mockResolvedValueOnce({
        data: { token: "fresh-better-auth-jwt" },
        error: null,
      });

      // 4. Retried C# API request with fresh token returns 200 OK
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ profile: "worker-data" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const data = await apiClient.get<{ profile: string }>("/workers/me");

      expect(data).toEqual({ profile: "worker-data" });
      // C# API called exactly twice (initial + 1 retry)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Better Auth queried twice (initial before request + re-ask on 401)
      expect(mockToken).toHaveBeenCalledTimes(2);

      // Verify NO custom POST to /auth/refresh occurred
      for (const [url, init] of mockFetch.mock.calls) {
        expect(url).not.toContain("/auth/refresh");
        if (init?.body) {
          expect(String(init.body)).not.toContain("refreshToken");
        }
      }

      // Check retried call had the refreshed Bearer token
      const [retriedUrl, retriedInit] = mockFetch.mock.calls[1];
      expect(retriedUrl).toContain("/workers/me");
      const retriedHeaders = new Headers(retriedInit?.headers);
      expect(retriedHeaders.get("Authorization")).toBe(
        "Bearer fresh-better-auth-jwt"
      );
    });

    it("on 401, if Better Auth returns no fresh token, gives up immediately and throws typed ApiError", async () => {
      mockToken.mockResolvedValueOnce({
        data: { token: "stale-jwt" },
        error: null,
      });

      // Initial call fails with 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      // Re-asking Better Auth returns null (session expired or user logged out)
      mockToken.mockResolvedValueOnce({
        data: null,
        error: { status: 401, message: "Session expired" },
      });

      try {
        await apiClient.get("/account");
        throw new Error("Should have thrown ApiError");
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true);
        if (isApiError(err)) {
          expect(err.status).toBe(401);
          expect(err.name).toBe("ApiError");
          expect(err.message).toContain("Session expired or unauthorized");
        }
      }

      // Did not attempt a second C# fetch since Better Auth had no token
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("gives up if retried request STILL returns 401 (does not retry more than once)", async () => {
      mockToken.mockResolvedValueOnce({
        data: { token: "initial-token" },
        error: null,
      });

      // 1st C# call: 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      // Better Auth returns a new token
      mockToken.mockResolvedValueOnce({
        data: { token: "new-token-that-also-fails" },
        error: null,
      });

      // 2nd C# call (retry): STILL returns 401
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Forbidden or still invalid" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(apiClient.get("/secret")).rejects.toThrow(ApiError);

      // Exactly 2 C# calls (1 original + 1 retry, NOT infinite loop)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockToken).toHaveBeenCalledTimes(2);
    });

    it("deduplicates concurrent 401s so Better Auth is only re-asked once", async () => {
      mockToken.mockResolvedValue({
        data: { token: "stale-shared-token" },
        error: null,
      });

      // Count re-asks via customTokenResolver
      let reAskCount = 0;
      setBetterAuthTokenResolver(async (opts) => {
        if (opts?.forceRefresh) {
          reAskCount++;
          await new Promise((r) => setTimeout(r, 25));
          return "refreshed-shared-jwt";
        }
        return "stale-shared-token";
      });

      let csharpCallCount = 0;
      mockFetch.mockImplementation(async (url) => {
        csharpCallCount++;
        // First 2 calls return 401
        if (csharpCallCount <= 2) {
          return new Response(JSON.stringify({ message: "Expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        // Retried calls succeed
        return new Response(JSON.stringify({ url: String(url), ok: true }), {
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
      // Crucial: Only 1 re-ask was performed despite 2 concurrent 401s
      expect(reAskCount).toBe(1);
    });

    it("skips 401 re-ask when skipAuthRefresh option is enabled", async () => {
      mockToken.mockResolvedValueOnce({
        data: { token: "token-1" },
        error: null,
      });

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(
        apiClient.get("/strict-endpoint", { skipAuthRefresh: true })
      ).rejects.toThrow(ApiError);

      // Better Auth was only asked once before request; not re-asked on 401
      expect(mockToken).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
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
