"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Plus,
  Briefcase,
  Bookmark,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/post-a-job", label: "Post a Job", icon: Plus },
  { href: "/my-jobs", label: "My Jobs", icon: Briefcase },
  { href: "/saved-candidates", label: "Saved Candidates", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <span className="text-lg font-bold text-gray-900">SkillConnect</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 px-3">
            Worker Dashboard
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Log-out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
