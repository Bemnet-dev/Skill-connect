import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Runtime Environment Variable Validation
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates and exposes strictly typed environment variables across server
 * and client contexts using @t3-oss/env-nextjs and Zod.
 *
 * - Server vars: Accessible only in Node.js server runtimes, route handlers,
 *   and Server Components (throws error if imported by client bundle).
 * - Client vars: Must start with NEXT_PUBLIC_ and are statically inlined
 *   at build time for browser execution.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const env = createEnv({
  /**
   * Server-side environment variables
   * Not available in client components, throws if accessed in the browser
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Better Auth Server Secrets & Settings
    BETTER_AUTH_SECRET: z
      .string()
      .min(1, "BETTER_AUTH_SECRET must not be empty")
      .default("development-secret-skill-connect-auth-token-32-chars-minimum"),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),

    // Better Auth JWT Plugin Settings for downstream C# backend interop
    AUTH_JWT_ISSUER: z.string().default("skill-connect"),
    AUTH_JWT_AUDIENCE: z.string().default("skill-connect-api"),
    AUTH_JWT_EXPIRY: z.string().default("15m"),
  },

  /**
   * Client-side environment variables
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_API_BASE_URL: z.string().url().default("https://localhost:5001"),
    NEXT_PUBLIC_SIGNALR_HUB_URL: z
      .string()
      .url()
      .default("https://localhost:5001/hubs/realtime"),
    NEXT_PUBLIC_MAPS_PROVIDER_KEY: z.string().optional(),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
  },

  /**
   * Runtime environment mapping
   * Required for Next.js client bundling and edge compatibility
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    AUTH_JWT_ISSUER: process.env.AUTH_JWT_ISSUER,
    AUTH_JWT_AUDIENCE: process.env.AUTH_JWT_AUDIENCE,
    AUTH_JWT_EXPIRY: process.env.AUTH_JWT_EXPIRY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SIGNALR_HUB_URL: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL,
    NEXT_PUBLIC_MAPS_PROVIDER_KEY: process.env.NEXT_PUBLIC_MAPS_PROVIDER_KEY,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  },

  /**
   * Skip validation only when explicitly requested via SKIP_ENV_VALIDATION
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

export type Env = typeof env;
export default env;
