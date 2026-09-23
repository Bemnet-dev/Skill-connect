import {
  Briefcase,
  ChevronDown,
  // MapPin, // Commented unused import
  Search,
} from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-navbar">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between gap-4 px-4 lg:px-6">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
          aria-label="MyJob Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Briefcase className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            MyJob
          </span>
        </Link>

        {/* ── Country Selector ── */}
        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Select country"
        >
          <span className="text-base leading-none">🇮🇳</span>
          <span className="font-medium text-gray-700">India</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {/* ── Search Bar ── */}
        <div className="hidden lg:flex flex-1 max-w-[500px] items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Job title, keyword, company"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            aria-label="Search jobs"
          />
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            type="button"
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/sign-in"
            className="hidden sm:inline-flex h-11 items-center justify-center rounded-[4px] border border-primary/20 px-5 text-sm font-semibold text-primary transition-all hover:bg-primary-light hover:border-primary/40 active:scale-[0.98]"
          >
            Sign In
          </Link>

          <Link
            href="/post-job"
            className="inline-flex h-11 items-center justify-center rounded-[4px] bg-primary px-5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.98] shadow-sm"
          >
            Post A Jobs
          </Link>
        </div>
      </div>

      {/* ── Mobile Search (collapsed by default, can be toggled) ── */}
      <div className="lg:hidden border-t border-gray-200 px-4 py-3 hidden" id="mobile-search">
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Job title, keyword, company"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            aria-label="Search jobs on mobile"
          />
        </div>
      </div>
    </header>
  );
}
