/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import { NextRequest } from "next/server";
import {
  middleware,
  hasBetterAuthSessionCookie,
  getCachedSession,
  createMockCookieCache,
  getRoleHomeRoute,
  BETTER_AUTH_SESSION_COOKIE,
  SECURE_BETTER_AUTH_SESSION_COOKIE,
  BETTER_AUTH_SESSION_DATA_COOKIE,
  SECURE_BETTER_AUTH_SESSION_DATA_COOKIE,
  ADMIN_PATHS,
  WORKER_PATHS,
  CUSTOMER_PATHS,
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

describe("middleware (Edge Route Guards & Better Auth CookieCache)", () => {
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

  describe("getCachedSession & createMockCookieCache helpers", () => {
    it("successfully decodes and verifies a signed cookie cache at the edge", async () => {
      const mockCookie = await createMockCookieCache({
        user: { id: "u_worker", role: "worker", name: "Worker John" },
      });

      const request = createMockRequest(
        "/dashboard",
        `${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );

      const cached = await getCachedSession(request);
      expect(cached).not.toBeNull();
      expect(cached?.user?.role).toBe("worker");
      expect(cached?.user?.name).toBe("Worker John");
    });

    it("successfully decodes __Secure- prefixed cookie cache", async () => {
      const mockCookie = await createMockCookieCache({
        user: { id: "u_admin", role: "admin", name: "Admin Jane" },
      });

      const request = createMockRequest(
        "/verification-queue",
        `${SECURE_BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );

      const cached = await getCachedSession(request);
      expect(cached).not.toBeNull();
      expect(cached?.user?.role).toBe("admin");
    });

    it("returns null when cookie cache signature is tampered with", async () => {
      const mockCookie = await createMockCookieCache({
        user: { id: "u_fake", role: "admin" },
        secret: "different-unauthorized-secret-string-key-32-chars",
      });

      const request = createMockRequest(
        "/verification-queue",
        `${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );

      const cached = await getCachedSession(request);
      expect(cached).toBeNull();
    });

    it("returns null when cookie cache has expired", async () => {
      const mockCookie = await createMockCookieCache({
        user: { id: "u_expired", role: "worker" },
        expiresIn: -10, // expired 10 seconds ago
      });

      const request = createMockRequest(
        "/dashboard",
        `${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );

      const cached = await getCachedSession(request);
      expect(cached).toBeNull();
    });

    it("returns null when no session_data cookie exists", async () => {
      const request = createMockRequest("/dashboard", "other=123");
      const cached = await getCachedSession(request);
      expect(cached).toBeNull();
    });
  });

  describe("Route Configuration Constants", () => {
    it("contains expected route groupings", () => {
      expect(ADMIN_PATHS).toContain("/verification-queue");
      expect(ADMIN_PATHS).toContain("/disputes");
      expect(WORKER_PATHS).toContain("/dashboard");
      expect(WORKER_PATHS).toContain("/jobs");
      expect(CUSTOMER_PATHS).toContain("/bookings");
    });
  });

  describe("getRoleHomeRoute mapping", () => {
    it("returns /verification-queue for admin role", () => {
      expect(getRoleHomeRoute("admin")).toBe("/verification-queue");
      expect(getRoleHomeRoute("ADMIN")).toBe("/verification-queue");
    });

    it("returns /bookings for customer role", () => {
      expect(getRoleHomeRoute("customer")).toBe("/bookings");
    });

    it("returns /dashboard for worker role or undefined fallback", () => {
      expect(getRoleHomeRoute("worker")).toBe("/dashboard");
      expect(getRoleHomeRoute(undefined)).toBe("/dashboard");
    });
  });

  describe("Unauthenticated Protected Route Redirection", () => {
    it("redirects unauthenticated user accessing /dashboard to /login with callbackUrl", async () => {
      const request = createMockRequest("/dashboard");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard");
    });

    it("redirects unauthenticated user accessing nested /jobs/123 to /login", async () => {
      const request = createMockRequest("/jobs/123");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fjobs%2F123");
    });

    it("redirects unauthenticated user accessing /verification-queue to /login", async () => {
      const request = createMockRequest("/verification-queue");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fverification-queue");
    });

    it("allows unauthenticated access to public routes like /search and /workers", async () => {
      const searchReq = createMockRequest("/search");
      const workersReq = createMockRequest("/workers");

      expect((await middleware(searchReq)).status).toBe(200);
      expect((await middleware(workersReq)).status).toBe(200);
    });
  });

  describe("Role-based Route Guards with cookieCache", () => {
    describe("Admin Routes (/verification-queue, /disputes, /admin)", () => {
      it("allows admin user with valid cookie cache to access /verification-queue", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "admin", name: "Super Admin" },
        });
        const request = createMockRequest(
          "/verification-queue",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
        expect(response.headers.get("location")).toBeNull();
      });

      it("allows admin user to access /disputes", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "admin" },
        });
        const request = createMockRequest(
          "/disputes",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
      });

      it("redirects worker accessing /verification-queue to /dashboard", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "worker", name: "Worker Bob" },
        });
        const request = createMockRequest(
          "/verification-queue",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
      });

      it("redirects customer accessing /verification-queue to /bookings", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "customer", name: "Customer Alice" },
        });
        const request = createMockRequest(
          "/verification-queue",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/bookings");
      });

      it("redirects worker accessing /disputes to /dashboard", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "worker" },
        });
        const request = createMockRequest(
          "/disputes",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
      });
    });

    describe("Worker Routes (/dashboard, /jobs, /earnings)", () => {
      it("allows worker user to access /dashboard", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "worker" },
        });
        const request = createMockRequest(
          "/dashboard",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
      });

      it("allows admin user to access worker /dashboard", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "admin" },
        });
        const request = createMockRequest(
          "/dashboard",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
      });

      it("redirects customer accessing /dashboard to /bookings", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "customer" },
        });
        const request = createMockRequest(
          "/dashboard",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/bookings");
      });

      it("redirects customer accessing /earnings to /bookings", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "customer" },
        });
        const request = createMockRequest(
          "/earnings",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/bookings");
      });

      it("allows legacy session cookie (without cookie cache) to access /dashboard", async () => {
        const request = createMockRequest(
          "/dashboard",
          `${BETTER_AUTH_SESSION_COOKIE}=auth-active`
        );
        const response = await middleware(request);

        expect(response.status).toBe(200);
        expect(response.headers.get("location")).toBeNull();
      });
    });

    describe("Customer & Shared Routes (/bookings, /chat, /profile)", () => {
      it("allows customer user to access /bookings", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "customer" },
        });
        const request = createMockRequest(
          "/bookings",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
      });

      it("allows worker user to access /bookings", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "worker" },
        });
        const request = createMockRequest(
          "/bookings",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
      });

      it("allows any authenticated user to access /chat", async () => {
        const mockCookie = await createMockCookieCache({
          user: { role: "customer" },
        });
        const request = createMockRequest(
          "/chat",
          `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
        );

        const response = await middleware(request);
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Auth Route Redirection for Authenticated Users", () => {
    it("redirects authenticated worker visiting /login to /dashboard", async () => {
      const mockCookie = await createMockCookieCache({
        user: { role: "worker" },
      });
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("redirects authenticated customer visiting /login to /bookings", async () => {
      const mockCookie = await createMockCookieCache({
        user: { role: "customer" },
      });
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/bookings");
    });

    it("redirects authenticated admin visiting /login to /verification-queue", async () => {
      const mockCookie = await createMockCookieCache({
        user: { role: "admin" },
      });
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=tok; ${BETTER_AUTH_SESSION_DATA_COOKIE}=${mockCookie}`
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/verification-queue");
    });

    it("redirects authenticated user without cookie cache visiting /login to /dashboard (fallback)", async () => {
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=auth-active`
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("redirects authenticated user visiting /login with callbackUrl to callback destination", async () => {
      const request = createMockRequest(
        "/login",
        `${BETTER_AUTH_SESSION_COOKIE}=auth-active`,
        "callbackUrl=/bookings/new"
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/bookings/new");
    });

    it("allows unauthenticated guest to visit /login", async () => {
      const request = createMockRequest("/login");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });
});
