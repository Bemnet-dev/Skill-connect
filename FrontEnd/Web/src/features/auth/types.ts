/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth Feature Type Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports inferred schema types and defines auth domain models.
 */

export type {
  LoginInput,
  VerifyOtpInput,
  AuthUser,
  SessionInfo,
  SessionResponse,
  UserRole,
} from "./schema";

export type { RequestOtpResponse } from "./api";
export type { UseAuthReturn } from "./hooks/useAuth";

export type { Permission } from "./permissions";
export { ROLE_PERMISSIONS, getPermissionsForRole } from "./permissions";

/**
 * User interface aligned with AuthUser
 */
export type User = import("./schema").AuthUser;
