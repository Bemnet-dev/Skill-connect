"use client";

import * as React from "react";
import { X, Loader2 } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { RoleSidebar } from "./RoleSidebar";
import { ToastContainer } from "@/components/feedback/Toast";
import { useUiStore } from "@/state/store/uiStore";
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
      <ToastContainer />
    </div>
  );
}

export default AppShell;
