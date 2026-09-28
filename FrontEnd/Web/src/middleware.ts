import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieCache } from "better-auth/cookies";
import { createHMAC } from "@better-auth/utils/hmac";
import { base64Url } from "@better-auth/utils/base64";
import { env } from "@/env";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Cookie Constants
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";
export const SECURE_BETTER_AUTH_SESSION_COOKIE = "__Secure-better-auth.session_token";
export const BETTER_AUTH_SESSION_DATA_COOKIE = "better-auth.session_data";
export const SECURE_BETTER_AUTH_SESSION_DATA_COOKIE = "__Secure-better-auth.session_data";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Route Definitions & Role Mappings
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Routes strictly restricted to administrative personnel
 */
export const ADMIN_PATHS = [
  "/verification-queue",
  "/disputes",
  "/admin",
];

/**
 * Routes intended for service workers/professionals
 */
export const WORKER_PATHS = [
  "/dashboard",
  "/jobs",
  "/earnings",
  "/schedule",
];

/**
 * Routes intended for customer bookings
 */
export const CUSTOMER_PATHS = [
  "/bookings",
  "/saved-workers",
];

/**
 * Routes accessible to all authenticated users regardless of role
 */
export const SHARED_PROTECTED_PATHS = [
  "/chat",
  "/profile",
  "/settings",
];

/**
 * All routes that require an authenticated session before access
 */
export const PROTECTED_PATHS = [
  ...ADMIN_PATHS,
  ...WORKER_PATHS,
  ...CUSTOMER_PATHS,
  ...SHARED_PROTECTED_PATHS,
];

/**
 * Routes only meant for unauthenticated guests (e.g. login, OTP verification)
 */
export const AUTH_PATHS = ["/login", "/verify-otp"];

/**
 * Shape of the payload stored in the Better Auth session_data cookie cache
 */
export interface CachedSessionPayload {
  session: Record<string, unknown>;
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    [key: string]: unknown;
  };
  updatedAt?: number;
  version?: string;
}

/**
 * Checks for the presence of a Better Auth session token cookie
 */
export function hasBetterAuthSessionCookie(request: NextRequest): boolean {
  // 1. Direct O(1) checks for default standard and secure Better Auth cookie names
  const defaultCookie = request.cookies.get(BETTER_AUTH_SESSION_COOKIE);
  if (defaultCookie?.value && defaultCookie.value.trim() !== "") {
    return true;
  }

  const secureCookie = request.cookies.get(SECURE_BETTER_AUTH_SESSION_COOKIE);
  if (secureCookie?.value && secureCookie.value.trim() !== "") {
    return true;
  }

  // 2. Fallback check for custom cookiePrefix (e.g. `${prefix}.session_token`)
  return request.cookies.getAll().some(
    (cookie) =>
      cookie.name.endsWith(".session_token") &&
      Boolean(cookie.value && cookie.value.trim() !== "")
  );
}

/**
 * Reads and cryptographically verifies the cached session payload directly at the edge
 * without requiring any database connections or queries.
 */
export async function getCachedSession(
  request: NextRequest,
  secret: string = env.BETTER_AUTH_SECRET
): Promise<CachedSessionPayload | null> {
  try {
    const hasSecureData = Boolean(
      request.cookies.get(SECURE_BETTER_AUTH_SESSION_DATA_COOKIE)?.value?.trim()
    );
    const hasStandardData = Boolean(
      request.cookies.get(BETTER_AUTH_SESSION_DATA_COOKIE)?.value?.trim()
    );

    // 1. If secure cookie exists (production / HTTPS), decode it directly
    if (hasSecureData) {
      const cached = (await getCookieCache(request, {
        secret,
        isSecure: true,
      })) as CachedSessionPayload | null;
      if (cached) return cached;
    }

    // 2. If standard cookie exists (development / HTTP), decode it directly
    if (hasStandardData) {
      const cached = (await getCookieCache(request, {
        secret,
        isSecure: false,
      })) as CachedSessionPayload | null;
      if (cached) return cached;
    }

    // 3. Fallback: if custom prefix or neither standard matched directly
    if (!hasSecureData && !hasStandardData) {
      const fallback = (await getCookieCache(request, {
        secret,
        isSecure: false,
      })) as CachedSessionPayload | null;
      return fallback;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a signed Better Auth compact session_data cookie payload.
 * Useful for tests and synthetic cookie generation.
 */
export async function createMockCookieCache({
  user,
  session,
  secret = env.BETTER_AUTH_SECRET,
  expiresIn = 300,
}: {
  user: { id?: string; email?: string; name?: string; role?: string };
  session?: Record<string, unknown>;
  secret?: string;
  expiresIn?: number;
}): Promise<string> {
  const expiresAt = Date.now() + expiresIn * 1000;
  const sessionData = {
    session: session || {
      id: "sess_mock_123",
      userId: user.id || "usr_mock_123",
      token: "tok_mock_123",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: {
      id: user.id || "usr_mock_123",
      email: user.email || "mock@skillconnect.internal",
      name: user.name || "Mock User",
      role: user.role || "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    updatedAt: Date.now(),
    version: "1",
  };

  const signature = await createHMAC("SHA-256", "base64urlnopad").sign(
    secret,
    JSON.stringify({
      ...sessionData,
      expiresAt,
    })
  );

  return base64Url.encode(
    JSON.stringify({
      session: sessionData,
      expiresAt,
      signature,
    }),
    { padding: false }
  );
}

/**
 * Returns the default home destination route for a given user role
 */
export function getRoleHomeRoute(role?: string): string {
  switch (role?.toLowerCase()) {
    case "admin":
      return "/verification-queue";
    case "customer":
      return "/bookings";
    case "worker":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

/**
 * Helper to test whether a given pathname matches any prefix in a route list
 */
function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Validates that a callback URL is a safe local relative path (preventing open redirects).
 * Strictly guards against protocol-relative (//) and backslash-escaping (/\\) bypasses.
 */
export function getSafeCallbackUrl(urlParam: string | null): string | null {
  if (!urlParam) return null;
  if (
    urlParam.startsWith("/") &&
    !urlParam.startsWith("//") &&
    !urlParam.startsWith("/\\")
  ) {
    try {
      const parsed = new URL(urlParam, "http://localhost");
      if (parsed.origin === "http://localhost" && parsed.pathname.startsWith("/")) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Edge Middleware Implementation
 * ─────────────────────────────────────────────────────────────────────────────
 * Performs edge-level route guarding:
 * 1. Unauthenticated users visiting protected routes are redirected to /login with callbackUrl.
 * 2. Authenticated users visiting auth routes (/login, /verify-otp) are redirected to their role home.
 * 3. With Better Auth's cookieCache enabled, reads the user's role claim directly from the signed cookie
 *    cache at the edge, enforcing role-based guards without invoking downstream databases:
 *    - Admin routes (/verification-queue, /disputes, /admin) require role === 'admin'.
 *    - Worker routes (/dashboard, /jobs, /earnings) restrict 'customer' accounts, redirecting to /bookings.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Retrieve cached session directly at the edge without DB lookup
  const cachedSession = await getCachedSession(request);
  const rawRole = cachedSession?.user?.role;
  const role = typeof rawRole === "string" ? rawRole.toLowerCase() : undefined;

  const hasSessionCookie = hasBetterAuthSessionCookie(request);
  const isAuthenticated = Boolean(cachedSession || hasSessionCookie);

  const isAdminRoute = matchesPath(pathname, ADMIN_PATHS);
  const isWorkerRoute = matchesPath(pathname, WORKER_PATHS);
  const isProtected = matchesPath(pathname, PROTECTED_PATHS);
  const isAuthRoute = matchesPath(pathname, AUTH_PATHS);

  // 1. Unauthenticated user accessing any protected route -> redirect to /login
  if (isProtected && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user accessing auth routes (/login, /verify-otp) -> redirect to role home or callback
  if (isAuthRoute && isAuthenticated) {
    const callbackUrl = getSafeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
    const target = callbackUrl || getRoleHomeRoute(role);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = target.split("?")[0];
    const queryIdx = target.indexOf("?");
    redirectUrl.search = queryIdx !== -1 ? target.slice(queryIdx) : "";
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Role-based Route Guards for Authenticated Users:
  if (isAuthenticated) {
    // Admin routes: ONLY 'admin' role allowed
    if (isAdminRoute) {
      if (role !== "admin") {
        // Forbidden for non-admins: redirect to role-authorized home
        const target = getRoleHomeRoute(role);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = target;
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Worker routes: 'customer' accounts redirected to customer bookings
    if (isWorkerRoute) {
      if (role === "customer") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/bookings";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static files with extensions (e.g. hero-img.png, logo.svg)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*$).*)",
  ],
};

export default middleware;


