"use client";

import * as React from "react";
import { useSession, authClient } from "@/lib/auth-client";
import {
  getPermissionsForRole,
  type Permission,
} from "@/features/auth/permissions";
import type { UserRole } from "@/features/auth/schema";
import type { User } from "@/features/auth/types";
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
 * `isAuthenticated`, `role`, `userId`, `permissions`, `isLoading`) reading
 * directly from Better Auth's reactive `useSession()` at the call site.
 */
export function useAuth(): UseAuthReturn {
  // 1. Reactive Better Auth session read directly at the call site
  const sessionResult = useSession();

  // 2. Derive resolved user and session state
  const rawSessionData = sessionResult?.data;
  const rawSessionUser =
    rawSessionData && typeof rawSessionData === "object" && "user" in rawSessionData
      ? (rawSessionData as { user?: Record<string, unknown> }).user
      : null;

  const { user, role, userId, permissions, isAuthenticated } = React.useMemo(() => {
    if (rawSessionUser && rawSessionUser.id) {
      const resolvedRole: UserRole =
        (typeof rawSessionUser.role === "string"
          ? (rawSessionUser.role.toLowerCase() as UserRole)
          : undefined) || "customer";

      const normalizedUser: User = {
        id: String(rawSessionUser.id),
        name: rawSessionUser.name ? String(rawSessionUser.name) : null,
        fullName: rawSessionUser.fullName
          ? String(rawSessionUser.fullName)
          : rawSessionUser.name
          ? String(rawSessionUser.name)
          : null,
        email: rawSessionUser.email ? String(rawSessionUser.email) : null,
        role: resolvedRole,
        image: rawSessionUser.image ? String(rawSessionUser.image) : null,
        avatarUrl: rawSessionUser.avatarUrl
          ? String(rawSessionUser.avatarUrl)
          : rawSessionUser.image
          ? String(rawSessionUser.image)
          : null,
        phone: rawSessionUser.phone
          ? String(rawSessionUser.phone)
          : rawSessionUser.phoneNumber
          ? String(rawSessionUser.phoneNumber)
          : undefined,
        phoneNumber: rawSessionUser.phoneNumber
          ? String(rawSessionUser.phoneNumber)
          : rawSessionUser.phone
          ? String(rawSessionUser.phone)
          : undefined,
        isVerified: Boolean(rawSessionUser.isVerified),
        phoneNumberVerified: Boolean(rawSessionUser.phoneNumberVerified),
        onboardingCompleted: Boolean(rawSessionUser.onboardingCompleted),
      };

      return {
        user: normalizedUser,
        role: resolvedRole,
        userId: normalizedUser.id,
        permissions: getPermissionsForRole(resolvedRole),
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
  }, [rawSessionUser]);

  // 3. Compute loading state
  const isLoading = Boolean(sessionResult?.isPending);

  // 4. Resolve token
  const token = typeof window !== "undefined" ? getAuthToken() : null;

  // 5. Check permission callback
  const hasPermission = React.useCallback(
    (permission: Permission): boolean => permissions.includes(permission),
    [permissions]
  );

  // 6. Sign out convenience handler
  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await authApiLogout();
    } catch {
      // Backend sign-out endpoint may be unavailable or offline; proceed with local teardown
    } finally {
      clearAuthTokens();
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
