import { create } from "zustand";
import {
  getAuthToken,
  setAuthToken,
  setRefreshToken,
  clearAuthTokens,
} from "@/lib/api-client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * User & Authentication Models
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type UserRole = "customer" | "worker" | "admin";

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface SetAuthPayload {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface AuthState {
  /**
   * In-memory access token (mirrored with api-client header injector)
   */
  token: string | null;

  /**
   * Current authenticated user profile and role
   * Dev B's booking and payment hooks read user.id and user.role from here.
   */
  user: User | null;

  /**
   * Quick boolean flag indicating authenticated status
   */
  isAuthenticated: boolean;

  /**
   * Loading state during session rehydration or login transitions
   */
  isLoading: boolean;

  // ── Actions (Dev A's login flow writes to these) ───────────────────────────
  /**
   * Atomically commits authenticated session (token + user profile)
   */
  setAuth: (payload: SetAuthPayload) => void;

  /**
   * Updates only the access token in memory (e.g. after silent refresh)
   */
  setToken: (token: string | null) => void;

  /**
   * Updates the current user profile object
   */
  setUser: (user: User | null) => void;

  /**
   * Shallow-merges partial fields into the current user profile
   */
  updateUser: (partialUser: Partial<User>) => void;

  /**
   * Sets loading flag
   */
  setLoading: (isLoading: boolean) => void;

  /**
   * Clears tokens and resets auth store to initial logged-out state
   */
  logout: () => void;
}

const STORAGE_USER_KEY = "skilld_auth_user";

/**
 * Safely reads the initial user from localStorage if in a browser environment
 */
function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Safely persists user metadata to localStorage
 */
function persistUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  } catch {
    // Quota exceeded or cookies disabled
  }
}

const initialToken = typeof window !== "undefined" ? getAuthToken() : null;
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: !!(initialToken && initialUser),
  isLoading: false,

  setAuth: ({ token, user, refreshToken }: SetAuthPayload) => {
    // Sync token with centralized api-client
    setAuthToken(token);
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
    persistUser(user);

    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setToken: (token: string | null) => {
    setAuthToken(token);
    set((state) => ({
      token,
      isAuthenticated: !!(token && state.user),
    }));
  },

  setUser: (user: User | null) => {
    persistUser(user);
    set((state) => ({
      user,
      isAuthenticated: !!(state.token && user),
    }));
  },

  updateUser: (partialUser: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...partialUser };
      persistUser(updatedUser);
      return { user: updatedUser };
    });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  logout: () => {
    clearAuthTokens();
    persistUser(null);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Selector Hooks & Helpers for Dev B (Booking, Payments, Quotations)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Hook to retrieve the authenticated user's ID
 * Example: `const userId = useUserId();`
 */
export const useUserId = (): string | undefined =>
  useAuthStore((state) => state.user?.id);

/**
 * Hook to retrieve the authenticated user's role
 * Example: `const role = useUserRole();`
 */
export const useUserRole = (): UserRole | undefined =>
  useAuthStore((state) => state.user?.role);

/**
 * Hook to retrieve the full user object
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
 * Example: in utility functions or queryFn closures
 */
export const getUserId = (): string | undefined =>
  useAuthStore.getState().user?.id;

/**
 * Non-hook accessor to get the current user role outside of React components
 */
export const getUserRole = (): UserRole | undefined =>
  useAuthStore.getState().user?.role;

export default useAuthStore;
