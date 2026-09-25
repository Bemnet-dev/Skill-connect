import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Client Singleton
 * ─────────────────────────────────────────────────────────────────────────────
 * Configured with the JWT client plugin so client calls can retrieve
 * current JWTs to authenticate against the C# backend API.
 *
 * Better Auth handles session refresh, cookie caching, and rotation internally.
 */
export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),
  plugins: [jwtClient()],
  fetchOptions: {
    customFetchImpl: (...args: Parameters<typeof fetch>) => fetch(...args),
  },
});

export default authClient;
