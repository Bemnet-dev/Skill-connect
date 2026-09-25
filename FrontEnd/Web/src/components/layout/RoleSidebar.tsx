"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  MessageSquare,
  Bookmark,
  Settings,
  LayoutDashboard,
  Briefcase,
  DollarSign,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UserRole } from "@/state/store/authStore";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * RoleSidebar Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic navigation sidebar that adapts to the authenticated user's role:
 * - Customer: Browse workers, bookings, chat, saved pros, settings.
 * - Worker: Dashboard, job requests, schedule, earnings, profile.
 * - Admin: Platform analytics, verification queue, dispute mediation, users.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "primary" | "warning" | "success" | "danger";
}

export interface RoleSidebarProps {
  /** Explicit role override; defaults to current session user's role or 'customer' */
  role?: UserRole;
  /** Whether the sidebar is collapsed to icon-only mode */
  collapsed?: boolean;
  /** Callback fired when user toggles sidebar width */
  onToggleCollapse?: () => void;
  /** Optional custom container className */
  className?: string;
}

const customerNavItems: NavItem[] = [
  { label: "Find Workers", href: ROUTES.CUSTOMER.WORKERS, icon: Users },
  { label: "My Bookings", href: ROUTES.CUSTOMER.BOOKINGS, icon: Calendar },
  { label: "Messages", href: ROUTES.CUSTOMER.CHAT, icon: MessageSquare },
  { label: "Saved Workers", href: "/saved-workers", icon: Bookmark },
  { label: "Settings", href: "/profile", icon: Settings },
];

const workerNavItems: NavItem[] = [
  { label: "Dashboard", href: ROUTES.WORKER.DASHBOARD, icon: LayoutDashboard },
  { label: "Job Requests", href: ROUTES.WORKER.JOBS, icon: Briefcase, badge: "New", badgeVariant: "warning" },
  { label: "Schedule", href: "/schedule", icon: Calendar },
  { label: "Earnings", href: ROUTES.WORKER.EARNINGS, icon: DollarSign },
  { label: "Public Profile", href: "/profile", icon: UserIcon },
  { label: "Settings", href: "/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  {
    label: "Verification Queue",
    href: ROUTES.ADMIN.VERIFICATION_QUEUE,
    icon: ShieldCheck,
    badge: 5,
    badgeVariant: "danger",
  },
  { label: "Disputes", href: ROUTES.ADMIN.DISPUTES, icon: AlertTriangle },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "System Config", href: "/admin/settings", icon: Sliders },
];

export function RoleSidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  className,
}: RoleSidebarProps) {
  const pathname = usePathname() || "/";

  const { data: session } = useSession();

  const user = session?.user as Record<string, unknown> | undefined;
  const resolvedRole = (role || (user?.role as UserRole) || "customer") as UserRole;

  const navItems = React.useMemo(() => {
    switch (resolvedRole) {
      case "worker":
        return workerNavItems;
      case "admin":
        return adminNavItems;
      case "customer":
      default:
        return customerNavItems;
    }
  }, [resolvedRole]);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-gray-200 bg-white transition-all duration-200 shrink-0 z-30 select-none",
        collapsed ? "w-16" : "w-64",
        className
      )}
      aria-label={`${resolvedRole} navigation sidebar`}
    >
      {/* ── Top Role Indicator ── */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Portal
            </span>
            <Badge
              variant={
                resolvedRole === "worker"
                  ? "contract"
                  : resolvedRole === "admin"
                  ? "navy"
                  : "primary"
              }
              size="sm"
              className="capitalize"
            >
              {resolvedRole}
            </Badge>
          </div>
        )}

        {/* Collapse / Expand Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* ── Navigation Links List ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
                )}
              />

              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <Badge
                      variant={item.badgeVariant || "secondary"}
                      size="sm"
                      className="ml-auto text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Role Details Footer ── */}
      {!collapsed && (
        <div className="p-3 m-2 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-800">Need Assistance?</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            SkillConnect Support 24/7
          </p>
          <Link
            href="/contact"
            className="inline-block mt-2 text-[11px] font-semibold text-primary hover:underline"
          >
            Contact Help Desk &rarr;
          </Link>
        </div>
      )}
    </aside>
  );
}

export default RoleSidebar;
