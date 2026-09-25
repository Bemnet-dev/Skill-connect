"use client";

import * as React from "react";
import { useSession, authClient } from "@/lib/auth-client";
import {
  useAuthStore,
  deriveAuthState,
  getPermissionsForRole,
  type User,
  type UserRole,
  type Permission,
  type BetterAuthSessionData,
} from "@/state/store/authStore";
import { logout as authApiLogout } from "@/features/auth/api";
import { clearAuthTokens, getAuthToken } from "@/lib/api-client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useAuth Hook Return Type Definition
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface UseAuthReturn {
  /** The currently authenticated user profile, or null if unauthenticated */
  user: User | null;
  /** Boolean flag indicating whether the session is currently authenticated */
  isAuthenticated: boolean;
  /** Whether the session is currently being fetched or revalidated */
  isLoading: boolean;
  /** Alias for isLoading matching Better Auth convention */
  isPending: boolean;
  /** The user's platform role ('customer' | 'worker' | 'admin') or undefined if unauthenticated */
  role: UserRole | undefined;
  /** The unique ID of the authenticated user or undefined if unauthenticated */
  userId: string | undefined;
  /** List of granted system permissions for the active user role */
  permissions: Permission[];
  /** Helper function to verify if the active user possesses a given permission */
  hasPermission: (permission: Permission) => boolean;
  /** The raw Better Auth session payload if available */
  session: unknown;
  /** Active JWT bearer token for external backend requests or null */
  token: string | null;
  /** Any error encountered during session resolution */
  error: unknown;
  /** Cleanly terminates active session across API, store, and token storage */
  logout: () => Promise<void>;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useAuth Hook
 * ─────────────────────────────────────────────────────────────────────────────
 * Read-only convenience hook exposing reactive session state (`user`,
 * `isAuthenticated`, `role`, `userId`, `permissions`, `isLoading`) that every
 * page and layout component across customer, worker, and admin portals uses to
 * check authentication and authorization status.
 *
 * Integrates directly with Better Auth's reactive `useSession()` client hook
 * while maintaining synchronized derived reads in the thin Zustand `authStore`.
 *
 * @example
 * ```tsx
 * // Simple session gate
 * const { user, isAuthenticated, isLoading } = useAuth();
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 *
 * // Role-based access control
 * const { role, hasPermission } = useAuth();
 * if (role === "admin" && hasPermission("admin:access")) {
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  // 1. Reactive Better Auth session read
  const sessionResult = useSession();

  // 2. Reactive Zustand store read
  const storeUser = useAuthStore((state) => state.user);
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeRole = useAuthStore((state) => state.role);
  const storeUserId = useAuthStore((state) => state.userId);
  const storePermissions = useAuthStore((state) => state.permissions);
  const storeToken = useAuthStore((state) => state.token);
  const storeIsLoading = useAuthStore((state) => state.isLoading);

  // 3. Keep Zustand store synchronized with Better Auth reactive session
  React.useEffect(() => {
    if (
      sessionResult?.data &&
      typeof sessionResult.data === "object" &&
      "user" in sessionResult.data
    ) {
      const sessionData = sessionResult.data as BetterAuthSessionData;
      if (sessionData.user?.id) {
        useAuthStore.getState().syncFromSession(sessionData);
      }
    }
  }, [sessionResult?.data]);

  // 4. Derive resolved user and session state
  const rawSessionUser = (sessionResult?.data as BetterAuthSessionData | undefined)?.user;
  const hasValidSessionUser = Boolean(rawSessionUser && rawSessionUser.id);

  const { user, role, userId, permissions, isAuthenticated } = React.useMemo(() => {
    if (hasValidSessionUser && sessionResult?.data) {
      const derived = deriveAuthState(
        sessionResult.data as BetterAuthSessionData,
        sessionResult?.isPending ?? false
      );
      return {
        user: derived.user,
        role: derived.role,
        userId: derived.userId,
        permissions: derived.permissions,
        isAuthenticated: true,
      };
    }

    if (storeUser && storeUser.id && storeIsAuthenticated) {
      const resolvedRole = storeRole ?? storeUser.role;
      return {
        user: storeUser,
        role: resolvedRole,
        userId: storeUserId ?? storeUser.id,
        permissions:
          storePermissions && storePermissions.length > 0
            ? storePermissions
            : getPermissionsForRole(resolvedRole),
        isAuthenticated: true,
      };
    }

    return {
      user: null,
      role: undefined,
      userId: undefined,
      permissions: [] as Permission[],
      isAuthenticated: false,
    };
  }, [
    hasValidSessionUser,
    sessionResult?.data,
    sessionResult?.isPending,
    storeUser,
    storeIsAuthenticated,
    storeRole,
    storeUserId,
    storePermissions,
  ]);

  // 5. Compute combined loading state
  const isSessionPending = Boolean(sessionResult?.isPending);
  const isLoading = storeIsLoading || (isSessionPending && !isAuthenticated);

  // 6. Resolve token
  const token =
    storeToken || (typeof window !== "undefined" ? getAuthToken() : null);

  // 7. Check permission callback
  const hasPermission = React.useCallback(
    (permission: Permission): boolean => permissions.includes(permission),
    [permissions]
  );

  // 8. Sign out convenience handler
  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await authApiLogout();
    } catch {
      // Backend sign-out endpoint may be unavailable or offline; proceed with local teardown
    } finally {
      clearAuthTokens();
      useAuthStore.getState().reset();
      if (typeof authClient?.signOut === "function") {
        try {
          await authClient.signOut();
        } catch {
          // Ignored
        }
      }
    }
  }, []);

  return React.useMemo<UseAuthReturn>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isPending: isLoading,
      role,
      userId,
      permissions,
      hasPermission,
      session: sessionResult?.data ?? null,
      token,
      error: sessionResult?.error ?? null,
      logout,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      role,
      userId,
      permissions,
      hasPermission,
      sessionResult?.data,
      token,
      sessionResult?.error,
      logout,
    ]
  );
}

export default useAuth;
