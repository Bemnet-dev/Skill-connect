import { z } from "zod";
import {
  phoneInputSchema,
  otpSchema,
  idSchema,
} from "@/lib/validation/primitives";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth Feature Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical validation schemas for phone-based authentication, OTP verification,
 * and backend session responses.
 */

// ── 1. Login Schema (Phone Only) ─────────────────────────────────────────────

/**
 * Schema for initiating phone-based authentication (requesting an OTP code).
 * Strips formatting characters (spaces, hyphens, parentheses) and enforces
 * E.164 international phone number format.
 */
export const loginSchema = z.object({
  phone: phoneInputSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── 2. Verify OTP Schema (Phone + Code) ───────────────────────────────────────

/**
 * Normalizes input code by trimming whitespace and spaces, then enforces 6 digits.
 */
export const otpInputSchema = z
  .string()
  .min(1, "Verification code is required")
  .transform((val) => val.trim().replace(/\s+/g, ""))
  .pipe(otpSchema);

/**
 * Schema for verifying a one-time password code for a given phone number.
 */
export const verifyOtpSchema = z.object({
  phone: phoneInputSchema,
  code: otpInputSchema,
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ── 3. Session Schema (Backend Success Response) ──────────────────────────────

/**
 * Authorized system user roles.
 */
export const userRoleSchema = z.enum(["customer", "worker", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Schema representing the authenticated user profile returned from the backend.
 */
export const userSchema = z
  .object({
    id: idSchema,
    phone: z.string().optional(),
    phoneNumber: z.string().optional(),
    role: userRoleSchema.default("customer"),
    name: z.string().nullish(),
    fullName: z.string().nullish(),
    email: z.string().email().or(z.literal("")).nullish(),
    avatarUrl: z.string().url().or(z.literal("")).nullish(),
    image: z.string().nullish(),
    isVerified: z.boolean().optional().default(false),
    phoneNumberVerified: z.boolean().optional().default(false),
    onboardingCompleted: z.boolean().optional().default(false),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

export type AuthUser = z.infer<typeof userSchema>;

/**
 * Schema representing active session details returned by the auth server.
 */
export const sessionInfoSchema = z
  .object({
    id: z.string().min(1, "Session ID is required"),
    userId: z.string().min(1, "User ID is required"),
    token: z.string().optional(),
    expiresAt: z.union([z.string(), z.date()]),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    ipAddress: z.string().nullish(),
    userAgent: z.string().nullish(),
  })
  .passthrough();

export type SessionInfo = z.infer<typeof sessionInfoSchema>;

/**
 * Schema validating the successful session payload returned by the backend or Better Auth.
 * Expects an authenticated user record, an optional session record, and optional API JWT tokens.
 */
export const sessionSchema = z
  .object({
    user: userSchema,
    session: sessionInfoSchema.optional(),
    token: z.string().optional(),
    refreshToken: z.string().optional(),
  })
  .passthrough();

export type SessionResponse = z.infer<typeof sessionSchema>;
