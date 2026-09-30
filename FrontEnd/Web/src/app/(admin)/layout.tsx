import React from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, ArrowLeft } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Sub-navigation Header */}
      <div className="bg-brand-navy text-white border-b border-gray-800 sticky top-16 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto text-xs font-semibold">
            <Link
              href="/verification-queue"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verification Queue
            </Link>
            <Link
              href="/disputes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Disputes Desk
            </Link>
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-light bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
            Admin Console
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
