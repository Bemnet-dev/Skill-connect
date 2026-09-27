/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
} from "@/features/auth/permissions";

describe("Permissions & Role-based Access Control (src/features/auth/permissions.ts)", () => {
  it("defines explicit permissions for customer, worker, and admin roles", () => {
    expect(ROLE_PERMISSIONS.customer).toBeDefined();
    expect(ROLE_PERMISSIONS.worker).toBeDefined();
    expect(ROLE_PERMISSIONS.admin).toBeDefined();

    expect(ROLE_PERMISSIONS.customer).toContain("booking:create");
    expect(ROLE_PERMISSIONS.customer).toContain("booking:read");
    expect(ROLE_PERMISSIONS.customer).not.toContain("worker:accept_job");

    expect(ROLE_PERMISSIONS.worker).toContain("booking:read");
    expect(ROLE_PERMISSIONS.worker).toContain("worker:accept_job");
    expect(ROLE_PERMISSIONS.worker).toContain("worker:update_status");
    expect(ROLE_PERMISSIONS.worker).toContain("worker:manage_profile");
    expect(ROLE_PERMISSIONS.worker).not.toContain("admin:access");

    expect(ROLE_PERMISSIONS.admin).toContain("admin:access");
    expect(ROLE_PERMISSIONS.admin).toContain("booking:create");
    expect(ROLE_PERMISSIONS.admin).toContain("payment:refund");
  });

  describe("getPermissionsForRole", () => {
    it("returns correct permission array for valid roles", () => {
      expect(getPermissionsForRole("customer")).toEqual(ROLE_PERMISSIONS.customer);
      expect(getPermissionsForRole("worker")).toEqual(ROLE_PERMISSIONS.worker);
      expect(getPermissionsForRole("admin")).toEqual(ROLE_PERMISSIONS.admin);
    });

    it("normalizes case-insensitive role inputs", () => {
      expect(getPermissionsForRole("WORKER")).toEqual(ROLE_PERMISSIONS.worker);
      expect(getPermissionsForRole("Customer")).toEqual(ROLE_PERMISSIONS.customer);
      expect(getPermissionsForRole("ADMIN")).toEqual(ROLE_PERMISSIONS.admin);
    });

    it("returns empty array for missing or unknown roles", () => {
      expect(getPermissionsForRole(undefined)).toEqual([]);
      expect(getPermissionsForRole(null)).toEqual([]);
      expect(getPermissionsForRole("unknown_role")).toEqual([]);
    });
  });
});
