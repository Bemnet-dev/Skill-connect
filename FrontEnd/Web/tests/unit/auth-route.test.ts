/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import { GET, POST, PATCH, PUT, DELETE } from "@/app/api/auth/[...all]/route";

describe("Better Auth Catch-All Route Handler (src/app/api/auth/[...all]/route.ts)", () => {
  it("exports HTTP handler functions for GET, POST, PATCH, PUT, and DELETE", () => {
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
    expect(typeof PATCH).toBe("function");
    expect(typeof PUT).toBe("function");
    expect(typeof DELETE).toBe("function");
  });

  it("handles GET /api/auth/ok and responds with ok status", async () => {
    const request = new Request("http://localhost:3000/api/auth/ok", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ ok: true });
  });

  it("handles GET /api/auth/get-session returning null when unauthenticated", async () => {
    const request = new Request("http://localhost:3000/api/auth/get-session", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toBeNull();
  });
});
