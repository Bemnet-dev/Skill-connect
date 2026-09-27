"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { clearAuthTokens } from "@/lib/api-client";
import { ROUTES } from "@/lib/constants";
import { getDashboardLink } from "./AccountMenu";
import type { User } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MobileNav Component (Client Island)
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive mobile drawer navigation toggle for Server Component <Header />.
 */

export interface MobileNavProps {
  /** Authenticated user from Server Component, or null if unauthenticated */
  user?: User | null;
  /** Whether search input is enabled */
  showSearch?: boolean;
  /** Custom class name */
  className?: string;
}

export function MobileNav({ user, showSearch = true, className }: MobileNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  // Keyboard accessibility: Close mobile menu on Escape
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      clearAuthTokens();
      setIsOpen(false);
      router.push(ROUTES.HOME);
      router.refresh();
    } catch (err) {
      console.error("[MobileNav] Sign out error:", err);
    }
  };

  const userRole = (user as Record<string, unknown> | undefined)?.role as string | undefined;

  return (
    <div className={cn("md:hidden", className)}>
      {/* Mobile Menu Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* ── Mobile Dropdown Menu Drawer ── */}
      {isOpen && (
        <div className="absolute top-[76px] left-0 right-0 border-b border-gray-200 bg-white px-4 py-4 space-y-3 shadow-md animate-fadeIn z-40">
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
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-gray-100"
            >
              Find Workers
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-gray-100"
            >
              How it Works
            </Link>

            {user ? (
              <>
                <Link
                  href={getDashboardLink(userRole)}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-gray-100 font-semibold text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href={ROUTES.CUSTOMER.BOOKINGS}
                  onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-md font-semibold text-primary"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

export default MobileNav;
