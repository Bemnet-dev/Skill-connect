"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Search, Filter, Plus } from "lucide-react";
import { useMyBookings } from "@/features/booking/hooks/useBookings";
import { BookingListItem } from "@/features/booking/components/BookingListItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { type BookingStatus } from "@/features/booking/schema";

type FilterTab = "all" | "active" | "completed" | "cancelled";

/**
 * Customer Bookings Page — /bookings
 *
 * Client-Side Rendered (CSR) booking list for the authenticated customer.
 */
export default function CustomerBookingsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { data: bookings, isLoading, isError, refetch } = useMyBookings();

  const filteredBookings = (bookings || []).filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") {
      return (
        b.status === "Confirmed" ||
        b.status === "CheckedIn" ||
        b.status === "InProgress"
      );
    }
    if (activeTab === "completed") return b.status === "Completed";
    if (activeTab === "cancelled") {
      return b.status === "Cancelled" || b.status === "Disputed";
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Service Bookings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track confirmed technician appointments, active jobs, and payment receipts.
          </p>
        </div>
        <Link href="/">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Book a Professional
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {(
          [
            { id: "all", label: "All Bookings" },
            { id: "active", label: "In Progress" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled / Disputed" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
            >
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700 mb-3">
            Unable to retrieve your bookings. Please check your connection.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredBookings.length === 0 && (
        <EmptyState
          title="No bookings found"
          description={
            activeTab === "all"
              ? "You have not scheduled any service appointments yet."
              : `You have no ${activeTab} bookings.`
          }
          action={
            <Link href="/">
              <Button size="sm" variant="primary">
                Discover Skilled Tradespeople
              </Button>
            </Link>
          }
        />
      )}

      {/* Bookings List */}
      {!isLoading && !isError && filteredBookings.length > 0 && (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingListItem
              key={booking.id}
              booking={booking}
              perspective="customer"
            />
          ))}
        </div>
      )}
    </div>
  );
}
