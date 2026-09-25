import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Session Cookie Presence Check
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth docs recommend a lightweight cookie-presence check in middleware
 * (not full cryptographic/database validation, since middleware runs on the edge).
 * The authoritative session validation occurs server-side in API routes and Server Components.
 */
export const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";
export const SECURE_BETTER_AUTH_SESSION_COOKIE = "__Secure-better-auth.session_token";

/**
 * Returns true if a valid Better Auth session cookie is present on the request
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
 * Routes that require authentication before access
 */
export const PROTECTED_PATHS = [
  "/dashboard",
  "/earnings",
  "/jobs",
  "/bookings",
  "/chat",
  "/disputes",
  "/verification-queue",
];

/**
 * Routes only meant for unauthenticated guests (e.g. login, OTP verification)
 */
export const AUTH_PATHS = ["/login", "/verify-otp"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasBetterAuthSessionCookie(request);

  // Check if current path is a protected route
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and accessing login/auth routes, redirect to dashboard or callback
  const isAuthRoute = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isAuthRoute && isAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const target =
      callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

export default middleware;
