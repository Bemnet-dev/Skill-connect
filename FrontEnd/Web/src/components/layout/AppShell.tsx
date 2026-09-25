"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Loader2 } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { RoleSidebar } from "./RoleSidebar";
import { useUiStore, Toast, ToastType } from "@/state/store/uiStore";
import { UserRole } from "@/state/store/authStore";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AppShell Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary application layout container wrapping Header, optional RoleSidebar,
 * main page content, Footer, and the global reactive Toast notifications overlay.
 */

export interface AppShellProps {
  /** Page content */
  children: React.ReactNode;
  /** Whether to render the primary Header navigation */
  showHeader?: boolean;
  /** Whether to render the Footer */
  showFooter?: boolean;
  /** Whether to display the role-based navigation sidebar */
  showSidebar?: boolean;
  /** Explicit role for sidebar nav items (customer, worker, admin) */
  sidebarRole?: UserRole;
  /** Custom wrapper container className */
  className?: string;
  /** Custom main content container className */
  contentClassName?: string;
}

export function AppShell({
  children,
  showHeader = true,
  showFooter = true,
  showSidebar = false,
  sidebarRole,
  className,
  contentClassName,
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);
  const isGlobalLoading = useUiStore((state) => state.isGlobalLoading);
  const activeBanner = useUiStore((state) => state.activeBanner);
  const clearBanner = useUiStore((state) => state.clearBanner);

  return (
    <div className={cn("min-h-screen flex flex-col bg-white text-gray-900", className)}>
      {/* ── Top Announcement Banner (if active) ── */}
      {activeBanner && (
        <div
          className={cn(
            "relative flex items-center justify-between px-4 py-2.5 text-xs font-medium z-50 text-white shadow-sm",
            activeBanner.type === "warning" && "bg-warning",
            activeBanner.type === "info" && "bg-primary",
            activeBanner.type === "announcement" && "bg-brand-navy"
          )}
        >
          <div className="flex-1 text-center truncate">{activeBanner.message}</div>
          {activeBanner.dismissible !== false && (
            <button
              type="button"
              onClick={clearBanner}
              className="p-1 rounded hover:bg-black/10 focus:outline-none"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Sticky Top Header ── */}
      {showHeader && <Header />}

      {/* ── Main Layout Body with Optional Sidebar ── */}
      <div className="flex-1 flex w-full">
        {showSidebar && (
          <RoleSidebar
            role={sidebarRole}
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        )}

        <main className={cn("flex-1 min-w-0 flex flex-col", contentClassName)}>
          {children}
        </main>
      </div>

      {/* ── Footer ── */}
      {showFooter && <Footer />}

      {/* ── Fullscreen Loading Overlay ── */}
      {isGlobalLoading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs animate-fadeIn"
          aria-live="assertive"
          aria-busy="true"
        >
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 text-sm font-semibold text-gray-700">Loading...</p>
        </div>
      )}

      {/* ── Global Interactive Toast Notifications Container ── */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Individual Toast Notification Item
 * ─────────────────────────────────────────────────────────────────────────────
 */
const toastTypeStyles: Record<
  ToastType,
  { icon: React.ReactNode; bg: string; border: string; text: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-success shrink-0" />,
    bg: "bg-white",
    border: "border-success/30",
    text: "text-gray-900",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-danger shrink-0" />,
    bg: "bg-white",
    border: "border-danger/30",
    text: "text-gray-900",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-warning shrink-0" />,
    bg: "bg-white",
    border: "border-warning/30",
    text: "text-gray-900",
  },
  info: {
    icon: <Info className="h-5 w-5 text-info shrink-0" />,
    bg: "bg-white",
    border: "border-info/30",
    text: "text-gray-900",
  },
  default: {
    icon: <Info className="h-5 w-5 text-primary shrink-0" />,
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const style = toastTypeStyles[toast.type] || toastTypeStyles.default;

  // Auto-dismiss timer
  React.useEffect(() => {
    if (!toast.duration || toast.duration === Infinity) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-elevated border transition-all animate-slideUp",
        style.bg,
        style.border
      )}
      role="alert"
    >
      {style.icon}

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-bold text-gray-900 leading-tight">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-gray-600 mt-0.5 leading-normal">
          {toast.message}
        </p>

        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {toast.dismissible !== false && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default AppShell;
