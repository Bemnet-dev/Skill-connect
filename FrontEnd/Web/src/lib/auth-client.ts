import type { auth } from "@/lib/auth-server";
import { createAuthClient } from "better-auth/react";
import {
  jwtClient,
  phoneNumberClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { env } from "@/env";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Client Singleton
 * ─────────────────────────────────────────────────────────────────────────────
 * Client instance created via createAuthClient from better-auth/react, configured
 * with phoneNumber, jwt, and inferred server additional fields plugins.
 *
 * - jwtClient(): Mints and retrieves short-lived JWTs to authenticate against
 *   the C# backend API.
 * - phoneNumberClient(): Enables phone number + OTP sign-in and verification.
 * - inferAdditionalFields<typeof auth>(): Propagates custom user schema fields
 *   (e.g., role) from the server configuration to client session types.
 * - better-auth/react: Provides reactive useSession() hook and session management.
 *
 * NOTE (FR-AUTH-01): Skill-Connect is phone-OTP only. Email/password signIn and
 * signUp methods are deliberately not exported to prevent accidental usage.
 * Phone authentication is dispatched via authClient.phoneNumber methods.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const authClient = createAuthClient({
  baseURL:
    env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),
  plugins: [
    jwtClient(),
    phoneNumberClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});

export const { useSession, getSession, signOut } = authClient;

export type ClientSession = typeof authClient.$Infer.Session;
export type ClientUser = typeof authClient.$Infer.Session.user;

export default authClient;

