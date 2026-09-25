/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth Feature Public API Barrel
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical single import path for the authentication feature module:
 * - Schemas: loginSchema, verifyOtpSchema, otpInputSchema, sessionSchema,
 *            userSchema, sessionInfoSchema, userRoleSchema
 * - API: requestOtp, verifyOtp, logout
 * - Hooks: useLogin, useVerifyOtp, useAuth
 * - Types: LoginInput, VerifyOtpInput, SessionResponse, AuthUser, User,
 *          SessionInfo, UserRole, Permission, RequestOtpResponse,
 *          UseLoginOptions, LoginVariables, UseVerifyOtpOptions,
 *          VerifyOtpVariables, UseAuthReturn
 *
 * @example
 * ```ts
 * import {
 *   loginSchema,
 *   verifyOtpSchema,
 *   sessionSchema,
 *   requestOtp,
 *   verifyOtp,
 *   logout,
 *   useLogin,
 *   useVerifyOtp,
 *   useAuth,
 *   type AuthUser,
 *   type SessionResponse,
 *   type UseAuthReturn,
 * } from "@/features/auth";
 * ```
 */

// ── 1. Validation Schemas ─────────────────────────────────────────────────────
export {
  loginSchema,
  verifyOtpSchema,
  otpInputSchema,
  sessionSchema,
  userSchema,
  sessionInfoSchema,
  userRoleSchema,
} from "./schema";

// ── 2. API Functions ──────────────────────────────────────────────────────────
export {
  requestOtp,
  verifyOtp,
  logout,
} from "./api";

// ── 3. React Hooks ────────────────────────────────────────────────────────────
export {
  useLogin,
  useVerifyOtp,
  useAuth,
} from "./hooks";

// ── 4. Type Definitions & Inferred Schemas ────────────────────────────────────
export type {
  LoginInput,
  VerifyOtpInput,
  SessionResponse,
  AuthUser,
  SessionInfo,
  UserRole,
} from "./schema";

export type { RequestOtpResponse } from "./api";

export type {
  UseLoginOptions,
  LoginVariables,
  UseVerifyOtpOptions,
  VerifyOtpVariables,
  UseAuthReturn,
} from "./hooks";

export type {
  User,
  Permission,
} from "@/state/store/authStore";
