import React from "react";
import Link from "next/link";
import { Briefcase, LayoutDashboard, DollarSign, ArrowLeft } from "lucide-react";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Worker Sub-navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto text-xs font-semibold">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link
              href="/jobs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Jobs &amp; Leads
            </Link>
            <Link
              href="/earnings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Earnings
            </Link>
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Worker Portal
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
