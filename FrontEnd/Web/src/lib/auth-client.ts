import { createAuthClient } from "better-auth/react";
import { jwtClient, phoneNumberClient } from "better-auth/client/plugins";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Client Singleton
 * ─────────────────────────────────────────────────────────────────────────────
 * Client instance created via createAuthClient from better-auth/react, configured
 * with the phoneNumber and jwt client plugins.
 *
 * - jwtClient(): Mints and retrieves short-lived JWTs to authenticate against
 *   the C# backend API.
 * - phoneNumberClient(): Enables phone number + OTP sign-in and verification.
 * - better-auth/react: Provides reactive useSession() hook and session management.
 *
 * This centralized instance is imported by features, hooks, and context providers.
 */
export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),
  plugins: [jwtClient(), phoneNumberClient()],
  fetchOptions: {
    customFetchImpl: (...args: Parameters<typeof fetch>) => fetch(...args),
  },
});

export const { useSession, getSession, signIn, signUp, signOut } = authClient;

export default authClient;
