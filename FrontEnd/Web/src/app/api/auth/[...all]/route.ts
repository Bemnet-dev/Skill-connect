import { auth } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Next.js Catch-All Route Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounts Better Auth's server instance onto Next.js App Router.
 * Handles all authentication endpoints under /api/auth/*:
 * - /api/auth/sign-in/phone-number
 * - /api/auth/phone-number/send-otp
 * - /api/auth/phone-number/verify
 * - /api/auth/token (JWT retrieval for C# API)
 * - /api/auth/session
 * - /api/auth/sign-out
 * - /api/auth/ok
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
