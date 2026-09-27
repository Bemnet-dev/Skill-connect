"use client";

import * as React from "react";
import { X, Loader2 } from "lucide-react";
import { ToastContainer } from "@/components/feedback/Toast";
import { useUiStore } from "@/state/store/uiStore";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AppShellFeedback Component (Client Island)
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles reactive UI overlays (announcement banners, global loading spinner,
 * and toast notification container) from uiStore for the Server Component <AppShell />.
 */
export function AppShellFeedback() {
  const isGlobalLoading = useUiStore((state) => state.isGlobalLoading);
  const activeBanner = useUiStore((state) => state.activeBanner);
  const clearBanner = useUiStore((state) => state.clearBanner);

  return (
    <>
      {/* ── Top Announcement Banner (if active) ── */}
      {activeBanner && (
        <div
          className={cn(
            "relative flex items-center justify-between px-4 py-2.5 text-xs font-medium z-50 text-white shadow-sm",
            activeBanner.type === "warning" && "bg-warning",
            activeBanner.type === "info" && "bg-primary",
            activeBanner.type === "announcement" && "bg-brand-navy"
          )}
        >
          <div className="flex-1 text-center truncate">{activeBanner.message}</div>
          {activeBanner.dismissible !== false && (
            <button
              type="button"
              onClick={clearBanner}
              className="p-1 rounded hover:bg-black/10 focus:outline-none cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Fullscreen Loading Overlay ── */}
      {isGlobalLoading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs animate-fadeIn"
          aria-live="assertive"
          aria-busy="true"
        >
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 text-sm font-semibold text-gray-700">Loading...</p>
        </div>
      )}

      {/* ── Global Interactive Toast Notifications Container ── */}
      <ToastContainer />
    </>
  );
}

export default AppShellFeedback;
