import * as React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { RoleSidebar } from "./RoleSidebar";
import { SidebarToggle } from "./SidebarToggle";
import { AppShellFeedback } from "./AppShellFeedback";
import { UserRole } from "@/features/auth";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AppShell Component (Server Component)
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary application layout container implemented as a Server Component (SC-FE-003 §7.2).
 *
 * Directly renders Server Components (<Header />, <Footer />) and page children,
 * delegating client interactions to focused Client islands:
 * - <SidebarToggle />: Mobile sidebar toggle button and slide-out drawer (§7.2)
 * - <AppShellFeedback />: Reactive banner, global loading overlay, and toasts
 */

export interface AppShellProps {
  /** Page content */
  children: React.ReactNode;
  /** Optional custom header slot (defaults to Server Component <Header />) */
  header?: React.ReactNode;
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
  header,
  showHeader = true,
  showFooter = true,
  showSidebar = false,
  sidebarRole,
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-white text-gray-900", className)}>
      {/* ── Client Feedback Island (Banner, Loading Overlay, Toasts) ── */}
      <AppShellFeedback />

      {/* ── Sticky Top Header (Direct Server Component) ── */}
      {showHeader && (header ?? <Header />)}

      {/* ── Main Layout Body with Optional Sidebar ── */}
      <div className="flex-1 flex w-full">
        {showSidebar && (
          <>
            {/* Desktop Role Sidebar */}
            <RoleSidebar
              role={sidebarRole}
              className="hidden md:flex"
            />

            {/* Mobile Sidebar-Toggle Client Island (§7.2) */}
            <SidebarToggle role={sidebarRole} />
          </>
        )}

        <main className={cn("flex-1 min-w-0 flex flex-col", contentClassName)}>
          {children}
        </main>
      </div>

      {/* ── Footer ── */}
      {showFooter && <Footer />}
    </div>
  );
}

export default AppShell;
