import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { admin } from "better-auth/plugins/admin";
import { Pool } from "pg";
import { env } from "@/env";

/**
 * In-memory database store used for testing and mock adapter support.
 */
export const memoryStore: Record<string, unknown[]> = {};

export const AUTH_CONFIG = {
  jwt: {
    issuer: env.AUTH_JWT_ISSUER,
    audience: env.AUTH_JWT_AUDIENCE,
    expirationTime: env.AUTH_JWT_EXPIRY,
  },
  phone: {
    otpLength: 6,
    expiresIn: 300, // 5 minutes
  },
} as const;

/**
 * Type definition for custom OTP dispatchers (e.g. Twilio, Infobip, mock).
 * Set via setSmsDispatcher() at runtime.
 */
export type SmsDispatcher = (data: {
  phoneNumber: string;
  code: string;
  language?: string;
  telegramUserId?: number;
}) => Promise<void> | void;

let activeSmsDispatcher: SmsDispatcher | null = null;

/**
 * Configures or overrides the SMS delivery dispatcher.
 * Useful for testing or injecting SMS gateway integrations at runtime.
 */
export function setSmsDispatcher(dispatcher: SmsDispatcher | null) {
  activeSmsDispatcher = dispatcher;
}

/**
 * Sends OTP via Telegram by calling the frontend API endpoint
 */
export async function sendOtpViaTelegram(
  phoneNumber: string,
  code: string,
  language: string = "en",
  telegramUserId?: number
): Promise<void> {
  try {
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${appUrl}/api/telegram/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": env.INTERNAL_REVALIDATE_SECRET,
      },
      body: JSON.stringify({
        phoneNumber,
        code,
        language,
        telegramUserId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[AUTH] Failed to send OTP via Telegram:", error);
    }
  } catch (error) {
    console.error("[AUTH] Error sending OTP via Telegram:", error);
  }
}

/**
 * Normalizes phone numbers to a consistent digit representation for temp email generation.
 * Handles local 09... and international +2519... formats cleanly to prevent duplicate accounts.
 */
export function normalizePhoneForTempEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return String(Date.now());
  }
  // If Ethiopian 10 digits starting with 09 (e.g. 0911234567 -> 251911234567)
  if (digits.length === 10 && digits.startsWith("09")) {
    return `251${digits.slice(1)}`;
  }
  // If Ethiopian 9 digits starting with 9 (e.g. 911234567 -> 251911234567)
  if (digits.length === 9 && digits.startsWith("9")) {
    return `251${digits}`;
  }
  return digits;
}

/**
 * Resolves the authentication secret from the validated environment configuration.
 * Validation (minimum 32 characters, rejecting dev placeholders in production)
 * is strictly enforced at startup by the Zod schema in @/env.
 */
export function resolveAuthSecret(): string {
  return env.BETTER_AUTH_SECRET;
}

export const AUTH_SECRET = resolveAuthSecret();

/**
 * Resolves trusted browser origins for CSRF and redirect protection.
 * Uses centralized, validated environment variables from @/env.
 * Only includes legitimate frontend browser origins, strictly omitting backend API ports.
 */
export function resolveTrustedOrigins(): string[] {
  const isProd = env.NODE_ENV === "production";
  const origins = new Set<string>();

  // Primary frontend web app URL
  try {
    origins.add(new URL(env.NEXT_PUBLIC_APP_URL).origin);
  } catch {
    origins.add(env.NEXT_PUBLIC_APP_URL);
  }

  // Base auth URL if distinct from frontend origin
  if (env.BETTER_AUTH_URL) {
    try {
      origins.add(new URL(env.BETTER_AUTH_URL).origin);
    } catch {
      origins.add(env.BETTER_AUTH_URL);
    }
  }

  // Optional explicitly configured trusted origins
  if (env.BETTER_AUTH_TRUSTED_ORIGINS) {
    env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  // Local development loopback frontend hosts (NOT backend API port 5001)
  if (!isProd) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return Array.from(origins);
}

export const auth = betterAuth({
  appName: "Skill-Connect",
  baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_APP_URL,
  secret: AUTH_SECRET,
  trustedOrigins: resolveTrustedOrigins(),
  rateLimit: {
    enabled: env.NODE_ENV !== "test",
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/api/auth/phone-number/send-otp": {
        window: 60,
        max: 3,
      },
      "/phone-number/send-otp": {
        window: 60,
        max: 3,
      },
      "/api/auth/phone-number/verify": {
        window: 60,
        max: 5,
      },
      "/phone-number/verify": {
        window: 60,
        max: 5,
      },
    },
  },
  database: new Pool({ connectionString: env.DATABASE_URL }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache TTL
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },
  plugins: [
    admin({
      adminRoles: ["admin"],
    }),
    phoneNumber({
      otpLength: AUTH_CONFIG.phone.otpLength,
      expiresIn: AUTH_CONFIG.phone.expiresIn,
      sendOTP: async ({ phoneNumber, code }) => {
        if (activeSmsDispatcher) {
          await activeSmsDispatcher({ phoneNumber, code });
        }

        // Always log OTP for development
        console.warn(
          `[AUTH] OTP for ${phoneNumber}: ${code} ` +
          `(configure SmsDispatcher via setSmsDispatcher() for production)`
        );

        // Try to send via Telegram if user has linked their account
        // We need to find the telegram user ID from the phone number
        try {
          // Check if there's a telegram user mapping for this phone number
          const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const mappingResponse = await fetch(`${appUrl}/api/telegram/get-mapping`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": env.INTERNAL_REVALIDATE_SECRET,
            },
            body: JSON.stringify({ phoneNumber }),
          });

          if (mappingResponse.ok) {
            const mapping = await mappingResponse.json();
            if (mapping.telegramUserId) {
              await sendOtpViaTelegram(phoneNumber, code, mapping.language || "en", mapping.telegramUserId);
            }
          }
        } catch (error) {
          console.error("[AUTH] Error checking Telegram mapping:", error);
        }
      },
      signUpOnVerification: {
        getTempEmail: (phone: string) =>
          `user_${normalizePhoneForTempEmail(phone)}@skillconnect.internal`,
        getTempName: (phone: string) => phone,
      },
    }),
    jwt({
      jwt: {
        issuer: AUTH_CONFIG.jwt.issuer,
        audience: AUTH_CONFIG.jwt.audience,
        expirationTime: AUTH_CONFIG.jwt.expirationTime,
        definePayload: ({ user, session }) => {
          const userRecord = user as Record<string, unknown>;
          return {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: userRecord.role || "customer",
            phoneNumber: userRecord.phoneNumber,
            sessionId: session.id,
          };
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

export default auth;