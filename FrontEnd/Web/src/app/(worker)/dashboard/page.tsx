"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  Briefcase,
  CheckCircle2,
  Star,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useMyBookings } from "@/features/booking/hooks/useBookings";
import { useOpenJobRequests } from "@/features/quotation/hooks/useJobRequests";
import { BookingListItem } from "@/features/booking/components/BookingListItem";
import { JobRequestCard } from "@/features/quotation/components/JobRequestCard";
import { Button } from "@/components/ui/Button";

export default function WorkerDashboardPage() {
  const { data: bookings } = useMyBookings();
  const { data: openJobs } = useOpenJobRequests();

  const activeBookings = (bookings || []).filter(
    (b) =>
      b.status === "Confirmed" ||
      b.status === "CheckedIn" ||
      b.status === "InProgress"
  );

  const completedCount = (bookings || []).filter(
    (b) => b.status === "Completed"
  ).length;

  const totalEarnings = (bookings || [])
    .filter((b) => b.status === "Completed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Worker Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here is a summary of your active engagements and customer requests.
          </p>
        </div>
        <Link href="/jobs">
          <Button variant="primary" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Browse Open Jobs
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Earnings
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalEarnings.toLocaleString()}{" "}
            <span className="text-xs font-normal text-gray-500">ETB</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Payouts verified
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Bookings
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {activeBookings.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Requiring service on site</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Jobs Completed
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
          <p className="text-xs text-gray-500 mt-1">100% satisfaction score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Worker Rating
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">4.9 / 5.0</div>
          <p className="text-xs text-amber-700 font-medium mt-1">Verified Top Rated</p>
        </div>
      </div>

      {/* Active Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Active Bookings</h2>
          <span className="text-xs text-gray-500">
            {activeBookings.length} active
          </span>
        </div>

        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            You have no active bookings right now. Review open customer leads below!
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map((b) => (
              <BookingListItem
                key={b.id}
                booking={b}
                perspective="worker"
              />
            ))}
          </div>
        )}
      </div>

      {/* Fresh Leads / Open Job Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fresh Leads Near You</h2>
            <p className="text-xs text-gray-500">Customers seeking bids in Addis Ababa</p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            See all leads <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(openJobs || []).slice(0, 4).map((job) => (
            <JobRequestCard key={job.id} job={job} />
          ))}
          {(!openJobs || openJobs.length === 0) && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
              No open leads matching your trade right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
