import { create } from "zustand";
import { authClient } from "@/lib/auth-client";
import { getAuthToken, setAuthToken, clearAuthTokens } from "@/lib/api-client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * User & Role Domain Models
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type UserRole = "customer" | "worker" | "admin";

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

export interface User {
  id: string;
  phone?: string;
  phoneNumber?: string;
  role: UserRole;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  isVerified?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string | Date;
  [key: string]: unknown;
}

export interface BetterAuthSessionData {
  user?: Partial<User> & { id?: string; role?: string };
  session?: { id?: string; userId?: string; expiresAt?: string | Date; token?: string; [key: string]: unknown };
  token?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure Derivation Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Computes thin derived state (role, permissions, id, auth status) from Better Auth.
 * Better Auth owns the session state; this helper never duplicates credentials.
 */
export interface DerivedAuthState {
  userId?: string;
  role?: UserRole;
  permissions: Permission[];
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export function deriveAuthState(
  sessionData?: BetterAuthSessionData | null,
  isLoading = false
): DerivedAuthState {
  const rawUser = sessionData?.user;
  if (!rawUser || !rawUser.id) {
    return {
      userId: undefined,
      role: undefined,
      permissions: [],
      user: null,
      isAuthenticated: false,
      isLoading,
      token: typeof window !== "undefined" ? getAuthToken() : null,
    };
  }

  const role: UserRole = (rawUser.role?.toLowerCase() as UserRole) || "customer";
  const permissions = getPermissionsForRole(role);

  const user: User = {
    id: rawUser.id,
    role,
    phone: rawUser.phone || (rawUser as Record<string, unknown>).phoneNumber as string || "",
    phoneNumber: (rawUser as Record<string, unknown>).phoneNumber as string || rawUser.phone || "",
    fullName: rawUser.fullName || rawUser.name || "",
    name: rawUser.name || rawUser.fullName || "",
    email: rawUser.email,
    avatarUrl: rawUser.avatarUrl || rawUser.image || undefined,
    image: rawUser.image || rawUser.avatarUrl || null,
    isVerified: Boolean(rawUser.isVerified),
    onboardingCompleted: Boolean(rawUser.onboardingCompleted),
    ...rawUser,
  };

  return {
    userId: user.id,
    role,
    permissions,
    user,
    isAuthenticated: true,
    isLoading,
    token: typeof window !== "undefined" ? getAuthToken() : null,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand Auth Store (Thin Derived Read)
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth's client already holds the authoritative reactive session state (useSession()).
 * This store maintains only a thin derived read (role, permissions, userId) to provide
 * a clean Zustand-shaped API across the application (e.g. for Dev B's booking/payment hooks).
 */
export interface AuthState extends DerivedAuthState {
  /**
   * Synchronizes derived state from Better Auth session data
   */
  syncFromSession: (sessionData?: BetterAuthSessionData | null) => void;

  /**
   * Sets the active authenticated session and persists any returned tokens
   */
  setSession: (sessionData?: BetterAuthSessionData | null) => void;

  /**
   * Asynchronously fetches current session from Better Auth client and updates derived read
   */
  refreshFromBetterAuth: () => Promise<DerivedAuthState>;

  /**
   * Checks whether the current user has a specific permission
   */
  hasPermission: (permission: Permission) => boolean;

  /**
   * Resets derived state to unauthenticated
   */
  reset: () => void;

  // ── Backward-compatible adapters for existing callers & login flows ────────
  setAuth: (payload: { user: User; token?: string; refreshToken?: string }) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  updateUser: (partialUser: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

let activeAuthClient = authClient;

/**
 * Allows overriding or mocking the Better Auth client instance for authStore
 */
export function setBetterAuthClient(client: typeof authClient): void {
  activeAuthClient = client;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...deriveAuthState(null),

  syncFromSession: (sessionData?: BetterAuthSessionData | null) => {
    const derived = deriveAuthState(sessionData, false);
    set(derived);
  },

  setSession: (sessionData?: BetterAuthSessionData | null) => {
    if (sessionData && typeof sessionData === "object") {
      const candidateToken =
        ("token" in sessionData && typeof sessionData.token === "string"
          ? sessionData.token
          : null) ||
        ("session" in sessionData &&
        sessionData.session &&
        typeof sessionData.session === "object" &&
        "token" in sessionData.session &&
        typeof (sessionData.session as { token?: unknown }).token === "string"
          ? (sessionData.session as { token: string }).token
          : null);

      if (candidateToken) {
        setAuthToken(candidateToken);
      }
    }

    const derived = deriveAuthState(sessionData, false);
    set({
      ...derived,
      token: getAuthToken() || derived.token,
    });
  },

  refreshFromBetterAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await activeAuthClient.getSession();
      const derived = deriveAuthState(data as BetterAuthSessionData, false);
      set(derived);
      return derived;
    } catch {
      const fallback = deriveAuthState(null, false);
      set(fallback);
      return fallback;
    }
  },

  hasPermission: (permission: Permission): boolean => {
    return get().permissions.includes(permission);
  },

  reset: () => {
    set(deriveAuthState(null, false));
  },

  // ── Backward-Compatible Adapters ──────────────────────────────────────────
  setAuth: ({ user, token }: { user: User; token?: string }) => {
    if (token) {
      setAuthToken(token);
    }
    const derived = deriveAuthState({ user }, false);
    set({
      ...derived,
      token: token ?? getAuthToken(),
    });
  },

  setToken: (token: string | null) => {
    setAuthToken(token);
    set((state) => ({
      token,
      isAuthenticated: Boolean(token && state.userId),
    }));
  },

  setUser: (user: User | null) => {
    const derived = deriveAuthState(user ? { user } : null, false);
    set((state) => ({
      ...derived,
      token: state.token,
    }));
  },

  updateUser: (partialUser: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser: User = { ...state.user, ...partialUser };
      const derived = deriveAuthState({ user: updatedUser }, state.isLoading);
      return {
        ...derived,
        token: state.token,
      };
    });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  logout: () => {
    clearAuthTokens();
    if (activeAuthClient?.signOut) {
      activeAuthClient.signOut().catch(() => {
        // Ignored in offline / test environments
      });
    }
    set(deriveAuthState(null, false));
  },
}));

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * React Hook for Direct Better Auth Reactive Session Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Use this in React components when you want reactive updates directly from
 * Better Auth's useSession() combined with thin role & permissions reads.
 */
export function useDerivedAuth() {
  const session = authClient.useSession();
  const derived = deriveAuthState(
    session.data as BetterAuthSessionData,
    session.isPending
  );

  return {
    ...derived,
    session: session.data,
    isPending: session.isPending,
    error: session.error,
    hasPermission: (permission: Permission) =>
      derived.permissions.includes(permission),
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Selector Hooks & Accessors for Dev B (Booking, Payments, Quotations)
 * ─────────────────────────────────────────────────────────────────────────────
 * All read from the thin derived state without owning the source of truth.
 */

/**
 * Hook to retrieve the authenticated user's ID
 * Example: `const userId = useUserId();`
 */
export const useUserId = (): string | undefined =>
  useAuthStore((state) => state.userId);

/**
 * Hook to retrieve the authenticated user's role
 * Example: `const role = useUserRole();`
 */
export const useUserRole = (): UserRole | undefined =>
  useAuthStore((state) => state.role);

/**
 * Hook to retrieve the list of granted permissions
 * Example: `const permissions = usePermissions();`
 */
export const usePermissions = (): Permission[] =>
  useAuthStore((state) => state.permissions);

/**
 * Hook to check if the authenticated user has a specific permission
 * Example: `const canBook = useHasPermission("booking:create");`
 */
export const useHasPermission = (permission: Permission): boolean =>
  useAuthStore((state) => state.permissions.includes(permission));

/**
 * Hook to retrieve the user profile
 * Example: `const user = useCurrentUser();`
 */
export const useCurrentUser = (): User | null =>
  useAuthStore((state) => state.user);

/**
 * Hook to check if session is active
 * Example: `const isAuthenticated = useIsAuthenticated();`
 */
export const useIsAuthenticated = (): boolean =>
  useAuthStore((state) => state.isAuthenticated);

/**
 * Non-hook accessor to get the current user ID outside of React components
 * Example: in queryFn closures or utility functions
 */
export const getUserId = (): string | undefined =>
  useAuthStore.getState().userId;

/**
 * Non-hook accessor to get the current user role outside of React components
 */
export const getUserRole = (): UserRole | undefined =>
  useAuthStore.getState().role;

/**
 * Non-hook accessor to get the current permissions array outside of React components
 */
export const getPermissions = (): Permission[] =>
  useAuthStore.getState().permissions;

/**
 * Non-hook accessor to check permissions outside of React components
 */
export const hasPermission = (permission: Permission): boolean =>
  useAuthStore.getState().hasPermission(permission);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone authStore Dispatcher (Imperative API)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides imperative setters for mutation callbacks (e.g. useVerifyOtp)
 * without requiring React hooks.
 */
export const authStore = {
  setSession: (sessionData?: BetterAuthSessionData | null): void => {
    useAuthStore.getState().setSession(sessionData);
  },
  getState: (): AuthState => useAuthStore.getState(),
  logout: (): void => useAuthStore.getState().logout(),
  reset: (): void => useAuthStore.getState().reset(),
};

export default useAuthStore;
