import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { memoryAdapter } from "better-auth/adapters/memory";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Server Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines server-side authentication behavior for Skilld:
 * 
 * 1. Database Adapter:
 *    Uses Better Auth's memory adapter by default for in-memory development,
 *    testing, and lightweight deployments. Can be substituted with Postgres/
 *    Prisma/Drizzle adapters as persistent infrastructure is provisioned.
 *
 * 2. Phone Number Plugin:
 *    Enables passwordless phone + OTP sign-in, auto-provisioning temporary user
 *    accounts upon first successful phone verification, with a 6-digit OTP
 *    and a 5-minute (300s) expiry window.
 *
 * 3. JWT Plugin:
 *    Signs and issues short-lived JWTs (15-minute expiry) bearing the user's
 *    id, role, phone, and session context to authenticate frontend requests
 *    against the downstream C# backend API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const AUTH_CONFIG = {
  jwt: {
    issuer: process.env.AUTH_JWT_ISSUER || process.env.BETTER_AUTH_URL || "skill-connect",
    audience: process.env.AUTH_JWT_AUDIENCE || "skill-connect-api",
    expirationTime: process.env.AUTH_JWT_EXPIRY || "15m",
  },
  phone: {
    otpLength: 6,
    expiresIn: 300, // 5 minutes
  },
} as const;

/**
 * In-memory database store used by the default memory adapter.
 * Useful for development, unit testing, and clearing between test runs.
 */
export const memoryStore: Record<string, unknown[]> = {};

/**
 * Type definition for custom OTP dispatchers (e.g. Twilio, Infobip, mock).
 */
export type SmsDispatcher = (data: {
  phoneNumber: string;
  code: string;
}) => Promise<void> | void;

let activeSmsDispatcher: SmsDispatcher | null = null;

/**
 * Configures or overrides the SMS delivery dispatcher.
 * Useful for testing or injecting SMS gateway integrations at runtime.
 */
export function setSmsDispatcher(dispatcher: SmsDispatcher | null) {
  activeSmsDispatcher = dispatcher;
}

export const auth = betterAuth({
  appName: "Skill-Connect",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "development-secret-skill-connect-auth-token-32-chars-minimum",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://localhost:5001",
    "http://localhost:5001",
  ],
  database: memoryAdapter(memoryStore),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true,
      },
    },
  },
  plugins: [
    phoneNumber({
      otpLength: AUTH_CONFIG.phone.otpLength,
      expiresIn: AUTH_CONFIG.phone.expiresIn,
      sendOTP: async ({ phoneNumber, code }) => {
        if (activeSmsDispatcher) {
          await activeSmsDispatcher({ phoneNumber, code });
          return;
        }

        if (process.env.NODE_ENV !== "production") {
          console.info(
            `[Better Auth OTP] Destination: ${phoneNumber} | Verification Code: ${code}`
          );
        }
      },
      signUpOnVerification: {
        getTempEmail: (phone: string) =>
          `user_${phone.replace(/\D/g, "") || Date.now()}@skillconnect.internal`,
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
