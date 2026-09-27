"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  ChevronDown,
  LogOut,
  Calendar,
  LayoutDashboard,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { clearAuthTokens } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { User } from "@/lib/auth-server";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AccountMenu Component (Client Island)
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracted Client island for user avatar, profile dropdown, and logout.
 * Wrapped by Server Component <Header /> (SC-FE-003 §8.1).
 *
 * Receives the authenticated user from the Server Component to avoid client-side
 * auth flash, and provides full keyboard & outside-click accessibility.
 */

export interface AccountMenuProps {
  /** Authenticated user passed from Server Component, or null/undefined */
  user?: User | null;
  /** Optional custom class name for the wrapper */
  className?: string;
}

export function getUserInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function getDashboardLink(role?: string): string {
  switch (role) {
    case "worker":
      return ROUTES.WORKER.DASHBOARD;
    case "admin":
      return ROUTES.ADMIN.VERIFICATION_QUEUE;
    case "customer":
    default:
      return ROUTES.CUSTOMER.BOOKINGS;
  }
}

export function AccountMenu({ user, className }: AccountMenuProps) {
  const router = useRouter();

  // Reactive client-side session fallback when `user` prop is undefined
  const clientSession = authClient.useSession();

  const activeUser = user !== undefined ? user : clientSession?.data?.user;
  const isPending = user !== undefined ? false : (clientSession?.isPending ?? false);

  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard accessibility: Close menu on Escape key and restore focus
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      clearAuthTokens();
      setIsOpen(false);
      router.push(ROUTES.HOME);
      router.refresh();
    } catch (err) {
      console.error("[AccountMenu] Sign out error:", err);
    }
  };

  // If loading in client-only fallback mode, render avatar skeleton
  if (isPending) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton variant="circular" className="h-9 w-9" />
        <Skeleton variant="rectangular" className="hidden sm:block h-8 w-24 rounded-md" />
      </div>
    );
  }

  // If unauthenticated, don't render the account menu
  if (!activeUser) {
    return null;
  }

  const userRole = (activeUser as Record<string, unknown> | undefined)?.role as string | undefined;

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
          {getUserInitials(activeUser.name, activeUser.email)}
        </div>

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-gray-900 line-clamp-1 max-w-[120px]">
            {activeUser.name || activeUser.email?.split("@")[0]}
          </span>
          {userRole && (
            <Badge
              variant={
                userRole === "worker"
                  ? "contract"
                  : userRole === "admin"
                  ? "navy"
                  : "primary"
              }
              size="sm"
              className="py-0 px-1 text-[9px] mt-0.5 capitalize self-start"
            >
              {userRole}
            </Badge>
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* ── Dropdown Menu ── */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-2 shadow-elevated border border-gray-100 animate-scaleUp z-50"
          role="menu"
        >
          {/* User Summary Header */}
          <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {activeUser.name || "User"}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {activeUser.email || activeUser.id}
            </p>
          </div>

          <div className="space-y-0.5">
            <Link
              href={getDashboardLink(userRole)}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-primary-light hover:text-primary rounded-lg transition-colors"
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link
              href={ROUTES.CUSTOMER.BOOKINGS}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-primary-light hover:text-primary rounded-lg transition-colors"
              role="menuitem"
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span>My Bookings</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-primary-light hover:text-primary rounded-lg transition-colors"
              role="menuitem"
            >
              <UserIcon className="h-4 w-4 shrink-0" />
              <span>Profile & Settings</span>
            </Link>
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
