/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  useAuthStore,
  getUserId,
  getUserRole,
  getPermissions,
  hasPermission,
  deriveAuthState,
  getPermissionsForRole,
  setBetterAuthClient,
  type User,
  type BetterAuthSessionData,
} from "@/state/store/authStore";
import { getAuthToken } from "@/lib/api-client";

describe("authStore (Thin Derived Read from Better Auth Session)", () => {
  const mockCustomerSession: BetterAuthSessionData = {
    user: {
      id: "cust-101",
      email: "customer@example.com",
      name: "Alice Customer",
      role: "customer",
    },
    session: {
      id: "sess-1",
      userId: "cust-101",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };

  const mockWorkerSession: BetterAuthSessionData = {
    user: {
      id: "worker-202",
      email: "worker@example.com",
      name: "Bob Plumber",
      role: "worker",
      phone: "+1234567890",
      isVerified: true,
    },
    session: {
      id: "sess-2",
      userId: "worker-202",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };

  const mockAdminSession: BetterAuthSessionData = {
    user: {
      id: "admin-999",
      email: "admin@platform.com",
      name: "Super Admin",
      role: "admin",
    },
  };

  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  describe("Initial State", () => {
    it("starts with empty derived state when no session is present", () => {
      const state = useAuthStore.getState();
      expect(state.userId).toBeUndefined();
      expect(state.role).toBeUndefined();
      expect(state.permissions).toEqual([]);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(getUserId()).toBeUndefined();
      expect(getUserRole()).toBeUndefined();
      expect(getPermissions()).toEqual([]);
      expect(hasPermission("booking:create")).toBe(false);
    });
  });

  describe("Thin Derived Read: Role & Permissions Derivation", () => {
    it("derives customer role and specific customer permissions", () => {
      useAuthStore.getState().syncFromSession(mockCustomerSession);

      const state = useAuthStore.getState();
      expect(state.userId).toBe("cust-101");
      expect(state.role).toBe("customer");
      expect(state.isAuthenticated).toBe(true);

      // Customer permissions
      expect(state.permissions).toContain("booking:create");
      expect(state.permissions).toContain("booking:read");
      expect(state.permissions).toContain("payment:create");
      expect(state.permissions).not.toContain("worker:accept_job");
      expect(state.permissions).not.toContain("admin:access");

      expect(hasPermission("booking:create")).toBe(true);
      expect(hasPermission("worker:accept_job")).toBe(false);
    });

    it("derives worker role and specific worker permissions", () => {
      useAuthStore.getState().syncFromSession(mockWorkerSession);

      const state = useAuthStore.getState();
      expect(state.userId).toBe("worker-202");
      expect(state.role).toBe("worker");
      expect(state.isAuthenticated).toBe(true);

      // Worker permissions
      expect(state.permissions).toContain("worker:accept_job");
      expect(state.permissions).toContain("worker:update_status");
      expect(state.permissions).toContain("worker:manage_profile");
      expect(state.permissions).not.toContain("payment:refund");

      expect(hasPermission("worker:accept_job")).toBe(true);
      expect(hasPermission("payment:refund")).toBe(false);
    });

    it("derives admin role with full platform permissions", () => {
      useAuthStore.getState().syncFromSession(mockAdminSession);

      const state = useAuthStore.getState();
      expect(state.userId).toBe("admin-999");
      expect(state.role).toBe("admin");
      expect(state.isAuthenticated).toBe(true);

      // Admin has all permissions
      expect(hasPermission("admin:access")).toBe(true);
      expect(hasPermission("booking:create")).toBe(true);
      expect(hasPermission("worker:accept_job")).toBe(true);
      expect(hasPermission("payment:refund")).toBe(true);
    });

    it("pure helper deriveAuthState produces predictable output", () => {
      const derived = deriveAuthState(mockCustomerSession);
      expect(derived.userId).toBe("cust-101");
      expect(derived.role).toBe("customer");
      expect(derived.permissions).toEqual(getPermissionsForRole("customer"));
      expect(derived.isAuthenticated).toBe(true);
    });
  });

  describe("Async Session Sync via refreshFromBetterAuth", () => {
    it("queries authClient.getSession and updates derived store state", async () => {
      const mockGetSession = jest.fn<() => Promise<unknown>>().mockResolvedValue({
        data: mockWorkerSession,
        error: null,
      });
      setBetterAuthClient({
        getSession: mockGetSession,
      } as never);

      const derived = await useAuthStore.getState().refreshFromBetterAuth();

      expect(derived.userId).toBe("worker-202");
      expect(derived.role).toBe("worker");
      expect(useAuthStore.getState().role).toBe("worker");
      expect(useAuthStore.getState().hasPermission("worker:accept_job")).toBe(true);
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it("handles getSession failure gracefully and sets unauthenticated state", async () => {
      const mockGetSession = jest.fn<() => Promise<unknown>>().mockRejectedValue(new Error("Network error"));
      setBetterAuthClient({
        getSession: mockGetSession,
      } as never);

      const derived = await useAuthStore.getState().refreshFromBetterAuth();

      expect(derived.userId).toBeUndefined();
      expect(derived.isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("Dev B: Selectors & Non-Hook Accessors", () => {
    it("allows queryFn and utility functions to read userId, role, and permissions outside components", () => {
      useAuthStore.getState().syncFromSession(mockCustomerSession);

      expect(getUserId()).toBe("cust-101");
      expect(getUserRole()).toBe("customer");
      expect(getPermissions()).toContain("booking:create");
      expect(hasPermission("booking:create")).toBe(true);
      expect(hasPermission("worker:accept_job")).toBe(false);
    });
  });

  describe("Backward Compatible Adapters for Dev A Login & Logout", () => {
    it("setAuth updates derived state and syncs access token with api-client", () => {
      const mockUser: User = {
        id: "user-adapted-123",
        role: "worker",
        phone: "+1234567890",
        fullName: "Adapted Worker",
      };

      useAuthStore.getState().setAuth({
        user: mockUser,
        token: "custom-token-xyz",
      });

      expect(getUserId()).toBe("user-adapted-123");
      expect(getUserRole()).toBe("worker");
      expect(getAuthToken()).toBe("custom-token-xyz");
      expect(hasPermission("worker:accept_job")).toBe(true);
    });

    it("updateUser merges partial updates into derived user profile", () => {
      useAuthStore.getState().syncFromSession(mockCustomerSession);

      useAuthStore.getState().updateUser({
        fullName: "Alice Updated",
        avatarUrl: "https://example.com/alice.jpg",
      });

      const user = useAuthStore.getState().user;
      expect(user?.id).toBe("cust-101");
      expect(user?.fullName).toBe("Alice Updated");
      expect(user?.avatarUrl).toBe("https://example.com/alice.jpg");
    });

    it("logout clears derived state, clears tokens, and notifies Better Auth signOut", () => {
      const mockSignOut = jest.fn<() => Promise<unknown>>().mockResolvedValue({});
      setBetterAuthClient({
        signOut: mockSignOut,
      } as never);

      useAuthStore.getState().syncFromSession(mockCustomerSession);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.userId).toBeUndefined();
      expect(state.user).toBeNull();
      expect(state.role).toBeUndefined();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(getUserId()).toBeUndefined();
      expect(getAuthToken()).toBeNull();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
