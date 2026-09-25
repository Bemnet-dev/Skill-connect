/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import { NextRequest } from "next/server";
import {
  middleware,
  hasBetterAuthSessionCookie,
  BETTER_AUTH_SESSION_COOKIE,
  SECURE_BETTER_AUTH_SESSION_COOKIE,
} from "@/middleware";

function createMockRequest(
  pathname: string,
  cookieHeader?: string,
  searchParams?: string
): NextRequest {
  const url = `http://localhost:3000${pathname}${
    searchParams ? `?${searchParams}` : ""
  }`;
  const headers = new Headers();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  return new NextRequest(url, { headers });
}

describe("middleware (Better Auth Session Cookie Presence Check)", () => {
  describe("hasBetterAuthSessionCookie helper", () => {
    it("detects standard better-auth.session_token cookie", () => {
      const request = createMockRequest(
        "/dashboard",
        `${BETTER_AUTH_SESSION_COOKIE}=valid-session-token-xyz`
      );

      expect(hasBetterAuthSessionCookie(request)).toBe(true);
    });

    it("detects secure __Secure-better-auth.session_token cookie", () => {
      const request = createMockRequest(
        "/dashboard",
        `${SECURE_BETTER_AUTH_SESSION_COOKIE}=secure-session-token-123`
      );

      expect(hasBetterAuthSessionCookie(request)).toBe(true);
    });

    it("detects custom prefix session cookie ending in .session_token", () => {
      const request = createMockRequest(
        "/dashboard",
        `my-app.session_token=custom-prefixed-token`
      );

      expect(hasBetterAuthSessionCookie(request)).toBe(true);
    });

    it("returns false when no session cookie is present", () => {
      const request = createMockRequest(
        "/dashboard",
        "theme=dark; other_cookie=123"
      );

      expect(hasBetterAuthSessionCookie(request)).toBe(false);
    });

    it("returns false when session cookie is empty or whitespace only", () => {
      const request = createMockRequest(
        "/dashboard",
        `${BETTER_AUTH_SESSION_COOKIE}=   `
      );

      expect(hasBetterAuthSessionCookie(request)).toBe(false);
    });

    it("ignores old or made-up sc_session cookie without valid Better Auth cookie", () => {
      const request = createMockRequest("/dashboard", "sc_session=dummy-token");

      expect(hasBetterAuthSessionCookie(request)).toBe(false);
    });
  });

  describe("Protected Route Redirection", () => {
    it("redirects unauthenticated user accessing /dashboard to /login with callbackUrl", () => {
      const request = createMockRequest("/dashboard");
      const response = middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard");
    });

    it("redirects unauthenticated user accessing nested /jobs/123 to /login", () => {
      const request = createMockRequest("/jobs/123");
      const response = middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fjobs%2F123");
    });

    it("allows authenticated user with Better Auth cookie to access /dashboard", () => {
      const request = createMockRequest(
        "/dashboard",
        `${BETTER_AUTH_SESSION_COOKIE}=auth-active`
      );
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("allows unauthenticated access to public routes like /search and /workers", () => {
      const searchReq = createMockRequest("/search");
      const workersReq = createMockRequest("/workers");

      expect(middleware(searchReq).status).toBe(200);
      expect(middleware(workersReq).status).toBe(200);
    });
  });

  describe("Auth Route Redirection for Authenticated Users", () => {
    it("redirects authenticated user visiting /login to /dashboard", () => {
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=auth-active`
      );
      const response = middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/dashboard");
    });

    it("redirects authenticated user visiting /login with callbackUrl to callback destination", () => {
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=auth-active`,
        "callbackUrl=/bookings/new"
      );
      const response = middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/bookings/new");
    });

    it("allows unauthenticated guest to visit /login", () => {
      const request = createMockRequest("/login");
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });
});
