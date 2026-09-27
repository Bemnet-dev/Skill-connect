import * as React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Briefcase, Search, Bell } from "lucide-react";
import { auth, type User } from "@/lib/auth-server";
import { AccountMenu } from "./AccountMenu";
import { MobileNav } from "./MobileNav";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  /** Optional custom class name */
  className?: string;
  /** Whether to show the central search input */
  showSearch?: boolean;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Header Component (Server Component)
 * ─────────────────────────────────────────────────────────────────────────────
 * Per SC-FE-003 §8.1:
 * Server Component calling auth.api.getSession() directly on the server.
 * Eliminates client-side auth flash and layout shifts by resolving user state
 * at SSR time. Wraps the client island <AccountMenu user={user} /> for user
 * dropdown and logout interactions.
 */
export async function Header({ className, showSearch = true }: HeaderProps) {
  let user: User | null = null;

  try {
    const requestHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: requestHeaders,
    });
    if (sessionData) {
      user = sessionData.user;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Header] Server-side session retrieval error:", error);
    }
  }

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
          {user ? (
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

              {/* Extracted Client Island: AccountMenu */}
              <AccountMenu user={user} />
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

          {/* Mobile Menu Client Island */}
          <MobileNav user={user} showSearch={showSearch} />
        </div>
      </div>
    </header>
  );
}

export default Header;
