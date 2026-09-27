import { UserRole } from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Permission Types and Role Mappings
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Permission =
  | "booking:create"
  | "booking:read"
  | "booking:cancel"
  | "review:create"
  | "worker:accept_job"
  | "worker:update_status"
  | "worker:manage_profile"
  | "payment:create"
  | "payment:refund"
  | "admin:access";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  customer: [
    "booking:create",
    "booking:read",
    "booking:cancel",
    "review:create",
    "payment:create",
  ],
  worker: [
    "booking:read",
    "worker:accept_job",
    "worker:update_status",
    "worker:manage_profile",
  ],
  admin: [
    "booking:create",
    "booking:read",
    "booking:cancel",
    "review:create",
    "worker:accept_job",
    "worker:update_status",
    "worker:manage_profile",
    "payment:create",
    "payment:refund",
    "admin:access",
  ],
};

/**
 * Computes the authorized permissions list for a given role
 */
export function getPermissionsForRole(
  role?: UserRole | string | null
): Permission[] {
  if (!role) return [];
  const normalized = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[normalized] || [];
}
