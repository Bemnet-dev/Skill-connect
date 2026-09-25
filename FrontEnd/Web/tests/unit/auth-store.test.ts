/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  useAuthStore,
  getUserId,
  getUserRole,
  type User,
} from "@/state/store/authStore";
import { getAuthToken } from "@/lib/api-client";

describe("authStore (Zustand Auth Store)", () => {
  const mockCustomerUser: User = {
    id: "user-cust-123",
    phone: "+1234567890",
    role: "customer",
    fullName: "Jane Customer",
    email: "jane@example.com",
  };

  const mockWorkerUser: User = {
    id: "worker-pro-456",
    phone: "+1987654321",
    role: "worker",
    fullName: "John Electrician",
    email: "john@worker.com",
    isVerified: true,
  };

  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  describe("Initial State", () => {
    it("starts with empty token, null user, and unauthenticated", () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(getUserId()).toBeUndefined();
      expect(getUserRole()).toBeUndefined();
    });
  });

  describe("Dev A: Login & Auth Ingestion Flow", () => {
    it("setAuth updates token, user, and sets isAuthenticated to true", () => {
      const { setAuth } = useAuthStore.getState();

      setAuth({
        token: "mock-access-token-xyz",
        user: mockCustomerUser,
        refreshToken: "mock-refresh-token-abc",
      });

      const updated = useAuthStore.getState();
      expect(updated.token).toBe("mock-access-token-xyz");
      expect(updated.user).toEqual(mockCustomerUser);
      expect(updated.isAuthenticated).toBe(true);

      // Verifies sync with api-client token reader
      expect(getAuthToken()).toBe("mock-access-token-xyz");
    });

    it("setToken updates in-memory token and syncs with api-client", () => {
      const { setToken, setUser } = useAuthStore.getState();
      setUser(mockWorkerUser);

      setToken("rotated-jwt-token-777");

      expect(useAuthStore.getState().token).toBe("rotated-jwt-token-777");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(getAuthToken()).toBe("rotated-jwt-token-777");
    });

    it("updateUser shallow-merges profile updates without losing role or id", () => {
      const { setAuth, updateUser } = useAuthStore.getState();

      setAuth({
        token: "token-1",
        user: mockCustomerUser,
      });

      updateUser({
        fullName: "Jane Updated",
        avatarUrl: "https://example.com/avatar.png",
      });

      const user = useAuthStore.getState().user;
      expect(user?.id).toBe("user-cust-123");
      expect(user?.role).toBe("customer");
      expect(user?.fullName).toBe("Jane Updated");
      expect(user?.avatarUrl).toBe("https://example.com/avatar.png");
    });
  });

  describe("Dev B: Booking & Payment Consumption Flow", () => {
    it("booking hooks can read user.id and role reliably", () => {
      useAuthStore.getState().setAuth({
        token: "active-token",
        user: mockCustomerUser,
      });

      // Reading user.id from store state (e.g. in booking hook or queryFn)
      const currentUserId = getUserId();
      const currentRole = getUserRole();

      expect(currentUserId).toBe("user-cust-123");
      expect(currentRole).toBe("customer");
    });

    it("payment hooks correctly differentiate worker vs customer", () => {
      useAuthStore.getState().setAuth({
        token: "active-worker-token",
        user: mockWorkerUser,
      });

      expect(getUserId()).toBe("worker-pro-456");
      expect(getUserRole()).toBe("worker");
    });
  });

  describe("Logout Flow", () => {
    it("clears user, token, and resets api-client tokens", () => {
      const { setAuth, logout } = useAuthStore.getState();

      setAuth({
        token: "active-token",
        user: mockCustomerUser,
      });

      logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(getUserId()).toBeUndefined();
      expect(getAuthToken()).toBeNull();
    });
  });
});
