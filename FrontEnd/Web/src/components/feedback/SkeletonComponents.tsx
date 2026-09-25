import * as React from "react";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Domain Feedback Skeleton Components
 * ─────────────────────────────────────────────────────────────────────────────
 * Pre-composed loading states matching the primary data layouts across
 * customer, worker, and admin interfaces.
 */

/**
 * Skeleton placeholder for Job Postings & Service Requests
 */
export function JobCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4 animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
          <div className="space-y-1.5">
            <Skeleton variant="text" className="h-4 w-40" />
            <Skeleton variant="text" className="h-3 w-28 bg-gray-200/60" />
          </div>
        </div>
        <Skeleton variant="rectangular" className="h-6 w-20 rounded-full" />
      </div>

      <div className="space-y-2 pt-1">
        <Skeleton variant="text" className="h-3.5 w-full" />
        <Skeleton variant="text" className="h-3.5 w-4/5" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="h-6 w-16 rounded-md" />
          <Skeleton variant="rectangular" className="h-6 w-20 rounded-md" />
        </div>
        <Skeleton variant="button" className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Worker Profiles & Search Result Cards
 */
export function WorkerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" className="w-14 h-14 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="rectangular" className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton variant="text" className="h-3 w-24" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton variant="rectangular" className="h-3.5 w-12 rounded" />
            <Skeleton variant="text" className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Skills tags */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
        <Skeleton variant="rectangular" className="h-6 w-20 rounded-full" />
        <Skeleton variant="rectangular" className="h-6 w-14 rounded-full" />
      </div>

      {/* Bottom price + action button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-2.5 w-12" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
        <Skeleton variant="button" className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Customer & Worker Booking Cards
 */
export function BookingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4 animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Skeleton variant="text" className="h-3.5 w-24" />
          <Skeleton variant="rectangular" className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton variant="text" className="h-3 w-28" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" className="h-4 w-44" />
          <Skeleton variant="text" className="h-3 w-32" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton variant="text" className="h-4 w-16" />
          <Skeleton variant="text" className="h-3 w-12 ml-auto" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Skeleton variant="button" className="h-8 w-20 rounded-lg" />
        <Skeleton variant="button" className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Data Tables (Admin, Bookings, Transactions)
 */
export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-xs animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      {/* Table Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`th-${i}`}
            variant="text"
            className={cn(
              "h-3.5",
              i === 0 ? "w-28" : i === columns - 1 ? "w-16 ml-auto" : "flex-1"
            )}
          />
        ))}
      </div>

      {/* Table Body Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`tr-${rowIndex}`}
            className="flex items-center gap-4 px-6 py-4"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`td-${rowIndex}-${colIndex}`}
                className={cn(
                  colIndex === 0
                    ? "w-28"
                    : colIndex === columns - 1
                    ? "w-16 ml-auto"
                    : "flex-1"
                )}
              >
                {colIndex === 0 ? (
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" className="w-6 h-6 shrink-0" />
                    <Skeleton variant="text" className="h-3 w-20" />
                  </div>
                ) : colIndex === columns - 2 ? (
                  <Skeleton
                    variant="rectangular"
                    className="h-5 w-16 rounded-full"
                  />
                ) : (
                  <Skeleton
                    variant="text"
                    className={cn(
                      "h-3",
                      colIndex % 2 === 0 ? "w-3/4" : "w-1/2"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Detail Pages (Job Details, Booking Details, Worker Profile)
 */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-full max-w-6xl mx-auto space-y-6 animate-pulse", className)}
      aria-hidden="true"
    >
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton variant="text" className="h-3 w-16" />
        <span className="text-gray-300">/</span>
        <Skeleton variant="text" className="h-3 w-24" />
        <span className="text-gray-300">/</span>
        <Skeleton variant="text" className="h-3 w-32" />
      </div>

      {/* Detail Header Banner */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="w-16 h-16 shrink-0" />
          <div className="space-y-2">
            <Skeleton variant="text" className="h-6 w-64" />
            <div className="flex items-center gap-3">
              <Skeleton variant="text" className="h-3.5 w-28" />
              <Skeleton variant="text" className="h-3.5 w-24" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="button" className="h-10 w-28 rounded-xl" />
          <Skeleton variant="button" className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Grid Layout: Main Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
            <Skeleton variant="text" className="h-5 w-40" />
            <SkeletonText lines={4} />
            <SkeletonText lines={3} />
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
            <Skeleton variant="text" className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton variant="rectangular" className="h-14 rounded-xl" />
              <Skeleton variant="rectangular" className="h-14 rounded-xl" />
              <Skeleton variant="rectangular" className="h-14 rounded-xl" />
              <Skeleton variant="rectangular" className="h-14 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Sidebar Action Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
            <Skeleton variant="text" className="h-5 w-36" />
            <Skeleton variant="rectangular" className="h-12 w-full rounded-xl" />
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Skeleton variant="text" className="h-3.5 w-full" />
              <Skeleton variant="text" className="h-3.5 w-4/5" />
            </div>
            <Skeleton variant="button" className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for Dashboard Metric Cards
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3 animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-3.5 w-24" />
        <Skeleton variant="circular" className="w-9 h-9" />
      </div>
      <Skeleton variant="text" className="h-7 w-20" />
      <Skeleton variant="text" className="h-3 w-32" />
    </div>
  );
}

/**
 * Generic List Skeleton container
 */
export interface ListSkeletonProps {
  count?: number;
  renderItem?: (index: number) => React.ReactNode;
  className?: string;
  gap?: string;
}

export function ListSkeleton({
  count = 3,
  renderItem = (i) => <JobCardSkeleton key={i} />,
  className,
  gap = "space-y-4",
}: ListSkeletonProps) {
  return (
    <div className={cn(gap, className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => renderItem(i))}
    </div>
  );
}
