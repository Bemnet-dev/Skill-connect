/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";

// Mutate next/cache exported functions before importing route handler
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cache = require("next/cache");
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
cache.revalidatePath = mockRevalidatePath;
cache.revalidateTag = mockRevalidateTag;

import {
  POST,
  GET,
  REVALIDATION_SECRET,
} from "@/app/api/internal/revalidate-worker/route";

describe("Worker Profile ISR Revalidation Route (src/app/api/internal/revalidate-worker/route.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/internal/revalidate-worker", () => {
    it("rejects unauthorized request with 401 when secret is missing or invalid", async () => {
      const request = new NextRequest("http://localhost:3000/api/internal/revalidate-worker", {
        method: "POST",
        body: JSON.stringify({ workerId: "wkr_101", secret: "wrong-secret" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.revalidated).toBe(false);
      expect(json.error).toMatch(/unauthorized/i);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });

    it("rejects request with 400 when workerId is missing from payload", async () => {
      const request = new NextRequest("http://localhost:3000/api/internal/revalidate-worker", {
        method: "POST",
        headers: {
          "x-revalidation-secret": REVALIDATION_SECRET,
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.revalidated).toBe(false);
      expect(json.error).toMatch(/workerId.*required/i);
    });

    it("successfully revalidates worker profile path and tag via header secret", async () => {
      const request = new NextRequest("http://localhost:3000/api/internal/revalidate-worker", {
        method: "POST",
        headers: {
          "x-revalidation-secret": REVALIDATION_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ workerId: "wkr_101" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.revalidated).toBe(true);
      expect(json.workerId).toBe("wkr_101");
      expect(json.paths).toEqual(["/workers/wkr_101"]);
      expect(json.tags).toEqual(["worker-wkr_101"]);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/workers/wkr_101", "page");
      expect(mockRevalidateTag).toHaveBeenCalledWith("worker-wkr_101", "default");
    });

    it("successfully revalidates worker profile via Bearer authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/internal/revalidate-worker", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REVALIDATION_SECRET}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ workerId: "wkr_202" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.revalidated).toBe(true);
      expect(json.workerId).toBe("wkr_202");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/workers/wkr_202", "page");
      expect(mockRevalidateTag).toHaveBeenCalledWith("worker-wkr_202", "default");
    });

    it("successfully revalidates worker profile via JSON body secret", async () => {
      const request = new NextRequest("http://localhost:3000/api/internal/revalidate-worker", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ workerId: "wkr_303", secret: REVALIDATION_SECRET }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.revalidated).toBe(true);
      expect(json.workerId).toBe("wkr_303");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/workers/wkr_303", "page");
      expect(mockRevalidateTag).toHaveBeenCalledWith("worker-wkr_303", "default");
    });
  });

  describe("GET /api/internal/revalidate-worker", () => {
    it("rejects unauthorized GET request with 401 when secret is missing or invalid", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/internal/revalidate-worker?workerId=wkr_101&secret=invalid",
        { method: "GET" }
      );

      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.revalidated).toBe(false);
    });

    it("rejects GET request with 400 when workerId query param is missing", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/internal/revalidate-worker?secret=${REVALIDATION_SECRET}`,
        { method: "GET" }
      );

      const response = await GET(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.revalidated).toBe(false);
    });

    it("successfully revalidates worker profile via GET query parameters", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/internal/revalidate-worker?workerId=wkr_get_1&secret=${REVALIDATION_SECRET}`,
        { method: "GET" }
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.revalidated).toBe(true);
      expect(json.workerId).toBe("wkr_get_1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/workers/wkr_get_1", "page");
      expect(mockRevalidateTag).toHaveBeenCalledWith("worker-wkr_get_1", "default");
    });
  });
});
