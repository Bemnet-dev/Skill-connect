import { describe, it, expect, beforeEach } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";

// ─── Module Mocks ─────────────────────────────────────────────────────────────
// Use global `jest.mock` (not from @jest/globals import) so SWC hoists properly.
// The `jest` object from @jest/globals is NOT recognized by the SWC hoisting
// transform, causing mock factories to never execute.

jest.mock("@/lib/auth-client", () => {
  const useSessionMock = jest.fn().mockReturnValue({ data: null, isPending: false, error: null });
  const signOutMock = jest.fn().mockResolvedValue(undefined);
  const clientObj = {
    useSession: useSessionMock,
    signOut: signOutMock,
  };
  return {
    __esModule: true,
    authClient: clientObj,
    useSession: useSessionMock,
    getSession: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: signOutMock,
    default: clientObj,
  };
});

// ─── Imports (resolved AFTER jest.mock hoisting) ──────────────────────────────
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore, authStore } from "@/state/store/authStore";
import { apiClient, clearAuthTokens, getAuthToken, setAuthToken } from "@/lib/api-client";

// Retrieve typed mock references from the mocked module
const mockUseSession = authClient.useSession as jest.Mock;
const mockSignOut = authClient.signOut as jest.Mock;

describe("useAuth Hook (src/features/auth/hooks/useAuth.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStore.reset();
    clearAuthTokens();
    mockUseSession.mockReturnValue({ data: null, isPending: false, error: null });
    mockSignOut.mockResolvedValue(undefined);
  });

  it("returns unauthenticated defaults when no session is present", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false, error: null });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.userId).toBeUndefined();
    expect(result.current.role).toBeUndefined();
    expect(result.current.permissions).toEqual([]);
    expect(result.current.hasPermission("booking:create")).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it("returns active session when authenticated via Zustand authStore", () => {
    authStore.setSession({
      user: {
        id: "usr_store_123",
        phone: "+251911223344",
        role: "customer",
        name: "Bethlehem Customer",
        isVerified: true,
      },
      session: {
        id: "sess_123",
        userId: "usr_store_123",
        expiresAt: "2026-12-31T00:00:00.000Z",
      },
      token: "jwt_token_customer_store",
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.id).toBe("usr_store_123");
    expect(result.current.user?.name).toBe("Bethlehem Customer");
    expect(result.current.userId).toBe("usr_store_123");
    expect(result.current.role).toBe("customer");
    expect(result.current.permissions).toContain("booking:create");
    expect(result.current.hasPermission("booking:create")).toBe(true);
    expect(result.current.hasPermission("worker:accept_job")).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBe("jwt_token_customer_store");
  });

  it("returns active session and permissions when authenticated via Better Auth useSession", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "worker_ba_888",
          phoneNumber: "+251922334455",
          role: "worker",
          fullName: "Kebede Carpenter",
          isVerified: true,
        },
        session: {
          id: "sess_ba_888",
          userId: "worker_ba_888",
          expiresAt: "2026-11-01T00:00:00.000Z",
        },
      },
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe("worker_ba_888");
    expect(result.current.user?.fullName).toBe("Kebede Carpenter");
    expect(result.current.userId).toBe("worker_ba_888");
    expect(result.current.role).toBe("worker");
    expect(result.current.hasPermission("worker:accept_job")).toBe(true);
    expect(result.current.hasPermission("admin:access")).toBe(false);

    // Verify Zustand store was synchronized via useEffect
    await waitFor(() => {
      expect(useAuthStore.getState().userId).toBe("worker_ba_888");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  it("reflects admin role permissions correctly", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "admin_root_1",
          email: "admin@skillconnect.et",
          role: "admin",
          name: "System Admin",
        },
      },
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe("admin");
    expect(result.current.hasPermission("admin:access")).toBe(true);
    expect(result.current.hasPermission("booking:create")).toBe(true);
    expect(result.current.hasPermission("worker:accept_job")).toBe(true);
  });

  it("indicates loading while session query is pending for unauthenticated visitor", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPending).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("does not indicate loading if user is already authenticated in store", () => {
    authStore.setSession({
      user: {
        id: "cached_usr_1",
        role: "customer",
      },
    });

    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("clears state and calls logout endpoints when logout() is invoked", async () => {
    authStore.setSession({
      user: {
        id: "usr_to_logout",
        role: "customer",
      },
      token: "token_to_clear",
    });
    setAuthToken("token_to_clear");

    const apiPostSpy = jest.spyOn(apiClient, "post").mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(getAuthToken()).toBe("token_to_clear");

    await act(async () => {
      await result.current.logout();
    });

    // Verify API post was called
    expect(apiPostSpy).toHaveBeenCalledWith(
      "/api/auth/sign-out",
      undefined,
      undefined
    );

    // Verify Better Auth signOut was called
    expect(mockSignOut).toHaveBeenCalled();

    // Verify tokens were cleared
    expect(getAuthToken()).toBeNull();

    // Verify Zustand store was reset
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
