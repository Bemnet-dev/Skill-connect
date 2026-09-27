"use client";

import * as React from "react";
import { PanelLeft, X } from "lucide-react";
import { RoleSidebar } from "./RoleSidebar";
import { UserRole } from "@/features/auth";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SidebarToggle Component (Client Island SC-FE-003 §7.2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracted Client island for mobile sidebar toggle button and slide-out drawer.
 * Enables mobile navigation for RoleSidebar while keeping <AppShell /> a Server Component.
 */

export interface SidebarToggleProps {
  /** Explicit role for sidebar nav items (customer, worker, admin) */
  role?: UserRole;
  /** Optional custom class name */
  className?: string;
}

export function SidebarToggle({ role, className }: SidebarToggleProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close drawer on Escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className={cn("md:hidden", className)}>
      {/* Mobile Sidebar Toggle Button (§7.2) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-elevated hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform active:scale-95 cursor-pointer"
        aria-label={isOpen ? "Close sidebar navigation" : "Open sidebar navigation"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
      </button>

      {/* ── Mobile Sidebar Drawer & Backdrop ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-white shadow-2xl z-50 animate-slideInLeft">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Portal Menu
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none cursor-pointer"
                aria-label="Close sidebar drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <RoleSidebar role={role} className="w-full border-r-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SidebarToggle;
