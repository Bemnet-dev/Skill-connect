"use client";

import React from "react";
import { CheckCircle2, PlayCircle, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBooking, useUpdateBookingStatus } from "../hooks/useBooking";
import { type BookingStatus } from "../schema";

export interface BookingStatusActionsProps {
  bookingId: number | string;
  initialStatus: BookingStatus;
  userRole?: "customer" | "worker" | "admin";
  onStatusChange?: (newStatus: BookingStatus) => void;
}

/**
 * BookingStatusActions Component (Client Island SC-FE-003 §3/§8.3)
 *
 * Implements a dedicated client subtree for live booking status actions:
 * - Employs TanStack Query with staleTime: 0 for zero-latency status refreshes.
 * - Renders CheckIn, CheckOut, and ConfirmCompletion transitions with loading indicators.
 */
export function BookingStatusActions({
  bookingId,
  initialStatus,
  userRole = "customer",
  onStatusChange,
}: BookingStatusActionsProps) {
  // TanStack Query client island with strict staleTime: 0
  const { data: booking } = useBooking(bookingId, {
    staleTime: 0,
    refetchInterval: 5000,
  });

  const {
    mutate: updateStatus,
    isPending,
    isError,
    error,
  } = useUpdateBookingStatus(bookingId);

  const currentStatus: BookingStatus = booking?.status ?? initialStatus;

  const handleStatusUpdate = (newStatus: BookingStatus) => {
    updateStatus(newStatus, {
      onSuccess: () => {
        if (onStatusChange) onStatusChange(newStatus);
      },
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Booking Lifecycle Actions</h4>
          <p className="text-xs text-gray-500">Real-time status management</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          Current: {currentStatus}
        </span>
      </div>

      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error?.message || "Failed to update booking status."}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Worker: Check In */}
        {currentStatus === "Confirmed" && (
          <Button
            type="button"
            variant="outline"
            isLoading={isPending}
            onClick={() => handleStatusUpdate("CheckedIn")}
            className="flex items-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4 text-primary" />
            Check In at Site
          </Button>
        )}

        {/* Worker: Start Work */}
        {(currentStatus === "Confirmed" || currentStatus === "CheckedIn") && (
          <Button
            type="button"
            variant="primary"
            isLoading={isPending}
            onClick={() => handleStatusUpdate("InProgress")}
            className="flex items-center gap-2 text-sm"
          >
            <PlayCircle className="w-4 h-4" />
            Start Work
          </Button>
        )}

        {/* Customer / Worker: Confirm Completion */}
        {currentStatus === "InProgress" && (
          <Button
            type="button"
            variant="primary"
            isLoading={isPending}
            onClick={() => handleStatusUpdate("Completed")}
            className="flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Job Completion
          </Button>
        )}

        {/* When completed */}
        {currentStatus === "Completed" && (
          <div className="w-full flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              This job is completed. Escrow settlement released.
            </span>
          </div>
        )}

        {/* When cancelled */}
        {currentStatus === "Cancelled" && (
          <div className="w-full text-xs text-gray-500 italic">
            This booking has been cancelled.
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingStatusActions;
