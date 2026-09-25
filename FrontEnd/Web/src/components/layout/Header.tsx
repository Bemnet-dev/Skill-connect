"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Search,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Bell,
  Calendar,
  LayoutDashboard,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { clearAuthTokens } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Header Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized navigation chrome for SkillConnect.
 * Conditionally renders based on Better Auth's reactive session:
 * - Unauthenticated: "Log in" / "Sign in" + "Post a Job" / "Get Started" CTAs.
 * - Authenticated: User avatar/initials, name, role badge, notifications, and
 *   dropdown with dashboard links and logout.
 */

export interface HeaderProps {
  /** Optional custom class name */
  className?: string;
  /** Whether to show the central search input */
  showSearch?: boolean;
}

export function Header({ className, showSearch = true }: HeaderProps) {
  const router = useRouter();

  const sessionResult = authClient.useSession();
  const session = sessionResult?.data;
  const isPending = sessionResult?.isPending ?? false;
  const user = session?.user;

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      clearAuthTokens();
      setIsUserMenuOpen(false);
      router.push(ROUTES.HOME);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const userRole = (user as Record<string, unknown> | undefined)?.role as string | undefined;

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    switch (userRole) {
      case "worker":
        return ROUTES.WORKER.DASHBOARD;
      case "admin":
        return ROUTES.ADMIN.VERIFICATION_QUEUE;
      case "customer":
      default:
        return ROUTES.CUSTOMER.BOOKINGS;
    }
  };

  const getUserInitials = (name?: string, email?: string) => {
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
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white border-b border-gray-200 shadow-navbar",
        className
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between gap-4 px-4 lg:px-6">
        {/* ── Brand Logo ── */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2.5 shrink-0 select-none group"
          aria-label="SkillConnect Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
            <Briefcase className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 tracking-tight leading-none">
              Skill<span className="text-primary">Connect</span>
            </span>
            <span className="text-[10px] font-medium text-gray-500 tracking-wider uppercase mt-0.5">
              Service Marketplace
            </span>
          </div>
        </Link>

        {/* ── Optional Search Bar ── */}
        {showSearch && (
          <div className="hidden lg:flex flex-1 max-w-[480px] items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search skilled workers, plumbers, electricians..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              aria-label="Search workers and services"
            />
          </div>
        )}

        {/* ── Desktop Navigation Links ── */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link
            href={ROUTES.CUSTOMER.WORKERS}
            className="hover:text-primary transition-colors"
          >
            Find Workers
          </Link>
          <Link
            href="/how-it-works"
            className="hover:text-primary transition-colors"
          >
            How it Works
          </Link>
        </nav>

        {/* ── Auth State Actions ── */}
        <div className="flex items-center gap-3">
          {isPending ? (
            /* ── Loading Skeleton ── */
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" className="h-9 w-9" />
              <Skeleton variant="rectangular" className="hidden sm:block h-8 w-24 rounded-md" />
            </div>
          ) : user ? (
            /* ── Authenticated User State ── */
            <div className="flex items-center gap-3">
              {/* Notification icon */}
              <Link
                href={ROUTES.CUSTOMER.CHAT}
                className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Notifications & messages"
              >
                <Bell className="h-5 w-5" />
              </Link>

              {/* User Menu Trigger */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                    {getUserInitials(user.name, user.email)}
                  </div>

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-900 line-clamp-1 max-w-[120px]">
                      {user.name || user.email?.split("@")[0]}
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
                      isUserMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* ── Dropdown Menu ── */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-2 shadow-elevated border border-gray-100 animate-scaleUp z-50"
                    role="menu"
                  >
                    {/* User Summary Header */}
                    <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {user.email || user.id}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-primary-light hover:text-primary rounded-lg transition-colors"
                        role="menuitem"
                      >
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href={ROUTES.CUSTOMER.BOOKINGS}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-primary-light hover:text-primary rounded-lg transition-colors"
                        role="menuitem"
                      >
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>My Bookings</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
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
            </div>
          ) : (
            /* ── Unauthenticated State ("Log in" vs "Post a Job") ── */
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary hover:border-primary/40 transition-all active:scale-[0.98]"
              >
                Log In
              </Link>

              <Link
                href="/post-job"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-all active:scale-[0.98]"
              >
                Post a Job
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3 animate-fadeIn">
          {showSearch && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search workers, jobs..."
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
          )}

          <nav className="flex flex-col space-y-1 pt-1 text-sm font-medium text-gray-700">
            <Link
              href={ROUTES.CUSTOMER.WORKERS}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-gray-100"
            >
              Find Workers
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-gray-100"
            >
              How it Works
            </Link>

            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-gray-100 font-semibold text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href={ROUTES.CUSTOMER.BOOKINGS}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  My Bookings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-left px-3 py-2 rounded-md text-danger hover:bg-danger-light font-medium"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href={ROUTES.AUTH.LOGIN}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md font-semibold text-primary"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
