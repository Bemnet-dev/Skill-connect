import { create } from "zustand";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UI Store Domain Models & Types
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages pure UI state (toasts, modals, sidebar, global loading, banners).
 * Completely decoupled from authentication, user profiles, or backend credentials.
 */

export type ToastType = "success" | "error" | "warning" | "info" | "default";

export interface ToastAction {
  label: string;
  onClick: () => void;
  altText?: string;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  /** Auto-dismiss duration in milliseconds. Defaults to 5000ms. Set to 0 or Infinity for persistent. */
  duration?: number;
  /** Whether the user can manually dismiss the toast via a close button. Defaults to true. */
  dismissible?: boolean;
  action?: ToastAction;
  createdAt: number;
}

export type ToastInput = (
  | { message: string; title?: string }
  | string
) & {
  type?: ToastType;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  id?: string;
};

export interface ActiveBanner {
  id: string;
  message: string;
  type: "info" | "warning" | "announcement";
  dismissible?: boolean;
}

export interface UiState {
  /** Active toast notifications list */
  toasts: Toast[];
  /** Currently open modal identifier, or null if all modals are closed */
  activeModal: string | null;
  /** Arbitrary payload passed to the currently active modal */
  modalData: unknown;
  /** Responsive sidebar/drawer expansion toggle */
  isSidebarOpen: boolean;
  /** Global full-page loading indicator */
  isGlobalLoading: boolean;
  /** Global announcement or maintenance banner */
  activeBanner: ActiveBanner | null;
}

export interface UiActions {
  /** Adds a toast and returns its unique ID */
  addToast: (input: ToastInput | string) => string;
  /** Removes a toast by its unique ID */
  removeToast: (id: string) => void;
  /** Clears all active toasts */
  clearToasts: () => void;

  /** Convenience helpers for standard toast types */
  success: (message: string, options?: Omit<ToastInput, "type" | "message">) => string;
  error: (message: string, options?: Omit<ToastInput, "type" | "message">) => string;
  warning: (message: string, options?: Omit<ToastInput, "type" | "message">) => string;
  info: (message: string, options?: Omit<ToastInput, "type" | "message">) => string;

  /** Modal management */
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;

  /** Sidebar toggle */
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  /** Global loading overlay */
  setGlobalLoading: (loading: boolean) => void;

  /** Global announcement banner */
  setBanner: (banner: ActiveBanner | null) => void;
  clearBanner: () => void;

  /** Reset all UI state back to initial defaults */
  resetUi: () => void;
}

export type UiStore = UiState & UiActions;

const DEFAULT_TOAST_DURATION = 5000;

export const INITIAL_UI_STATE: UiState = {
  toasts: [],
  activeModal: null,
  modalData: null,
  isSidebarOpen: false,
  isGlobalLoading: false,
  activeBanner: null,
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Normalizes string or object toast input into a structured Toast
 */
function normalizeToast(input: ToastInput | string, defaultType: ToastType = "default"): Toast {
  if (typeof input === "string") {
    return {
      id: generateId(),
      type: defaultType,
      message: input,
      duration: DEFAULT_TOAST_DURATION,
      dismissible: true,
      createdAt: Date.now(),
    };
  }

  const {
    id = generateId(),
    type = defaultType,
    message,
    title,
    duration = DEFAULT_TOAST_DURATION,
    dismissible = true,
    action,
  } = input;

  return {
    id,
    type,
    title,
    message,
    duration,
    dismissible,
    action,
    createdAt: Date.now(),
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand uiStore Instance
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const useUiStore = create<UiStore>((set) => ({
  ...INITIAL_UI_STATE,

  addToast: (input) => {
    const toast = normalizeToast(input, "default");
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return toast.id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  success: (message, options) => {
    const toast = normalizeToast(
      {
        message,
        ...options,
        type: "success",
      },
      "success"
    );
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return toast.id;
  },

  error: (message, options) => {
    const toast = normalizeToast(
      {
        message,
        ...options,
        type: "error",
      },
      "error"
    );
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return toast.id;
  },

  warning: (message, options) => {
    const toast = normalizeToast(
      {
        message,
        ...options,
        type: "warning",
      },
      "warning"
    );
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return toast.id;
  },

  info: (message, options) => {
    const toast = normalizeToast(
      {
        message,
        ...options,
        type: "info",
      },
      "info"
    );
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return toast.id;
  },

  openModal: (modalId, data = null) => {
    set({ activeModal: modalId, modalData: data });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ isSidebarOpen: open });
  },

  setGlobalLoading: (loading) => {
    set({ isGlobalLoading: loading });
  },

  setBanner: (banner) => {
    set({ activeBanner: banner });
  },

  clearBanner: () => {
    set({ activeBanner: null });
  },

  resetUi: () => {
    set(INITIAL_UI_STATE);
  },
}));

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone Toast Dispatcher (Imperative API)
 * ─────────────────────────────────────────────────────────────────────────────
 * Enables triggering toasts from mutation callbacks, event listeners, or
 * non-React utility functions without needing React hooks.
 *
 * @example
 * ```ts
 * import { toast } from "@/state/store/uiStore";
 *
 * toast.success("Worker booked successfully!");
 * toast.error("Payment failed. Please verify your card details.");
 * ```
 */
export const toast = {
  add: (input: ToastInput | string): string => useUiStore.getState().addToast(input),
  success: (message: string, options?: Omit<ToastInput, "type" | "message">): string =>
    useUiStore.getState().success(message, options),
  error: (message: string, options?: Omit<ToastInput, "type" | "message">): string =>
    useUiStore.getState().error(message, options),
  warning: (message: string, options?: Omit<ToastInput, "type" | "message">): string =>
    useUiStore.getState().warning(message, options),
  info: (message: string, options?: Omit<ToastInput, "type" | "message">): string =>
    useUiStore.getState().info(message, options),
  dismiss: (id: string): void => useUiStore.getState().removeToast(id),
  clear: (): void => useUiStore.getState().clearToasts(),
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Non-Hook Direct Selectors
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getToasts = (): Toast[] => useUiStore.getState().toasts;
export const getActiveModal = (): string | null => useUiStore.getState().activeModal;
export const isModalOpen = (modalId: string): boolean =>
  useUiStore.getState().activeModal === modalId;
export const isSidebarOpen = (): boolean => useUiStore.getState().isSidebarOpen;
export const isGlobalLoading = (): boolean => useUiStore.getState().isGlobalLoading;

export default useUiStore;
