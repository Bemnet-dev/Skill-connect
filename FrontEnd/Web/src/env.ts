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
      .default("development-secret-skill-connect-auth-token-32-chars-minimum")
      .superRefine((val, ctx) => {
        if (process.env.NODE_ENV === "production") {
          if (
            val ===
            "development-secret-skill-connect-auth-token-32-chars-minimum"
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "BETTER_AUTH_SECRET must not use the development placeholder in production.",
            });
          }
          if (val.length < 32) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `BETTER_AUTH_SECRET must be at least 32 characters long in production (received ${val.length}).`,
            });
          }
        }
      }),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
    BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),

    // Better Auth JWT Plugin Settings for downstream C# backend interop
    AUTH_JWT_ISSUER: z.string().default("skill-connect"),
    AUTH_JWT_AUDIENCE: z.string().default("skill-connect-api"),
    AUTH_JWT_EXPIRY: z.string().default("15m"),

    // Internal On-Demand ISR Cache Invalidation Secret
    INTERNAL_REVALIDATE_SECRET: z
      .string()
      .min(1, "INTERNAL_REVALIDATE_SECRET must not be empty")
      .default("development-internal-revalidation-secret"),

    // Neon Postgres connection string (used by Better Auth adapter)
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL must not be empty")
      .url("DATABASE_URL must be a valid connection URL"),

    // Telegram OTP dispatcher
    TELEGRAM_BOT_TOKEN: z
      .string()
      .min(1, "TELEGRAM_BOT_TOKEN is required"),
    TELEGRAM_CHAT_ID: z
      .string()
      .min(1, "TELEGRAM_CHAT_ID is required"),
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
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().default("skillconnect_dev_bot"),
  },

  /**
   * Runtime environment mapping
   * Required for Next.js client bundling and edge compatibility
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
    AUTH_JWT_ISSUER: process.env.AUTH_JWT_ISSUER,
    AUTH_JWT_AUDIENCE: process.env.AUTH_JWT_AUDIENCE,
    AUTH_JWT_EXPIRY: process.env.AUTH_JWT_EXPIRY,
    INTERNAL_REVALIDATE_SECRET: process.env.INTERNAL_REVALIDATE_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SIGNALR_HUB_URL: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL,
    NEXT_PUBLIC_MAPS_PROVIDER_KEY: process.env.NEXT_PUBLIC_MAPS_PROVIDER_KEY,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    DATABASE_URL: process.env.DATABASE_URL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  },

  /**
   * Skip validation only when explicitly requested via SKIP_ENV_VALIDATION
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

export type Env = typeof env;
export default env;
