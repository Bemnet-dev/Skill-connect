"use client";

import React, { useState } from "react";
import { TrendingUp, Calendar, DollarSign, Award } from "lucide-react";

export interface EarningsDataPoint {
  label: string;
  amount: number;
  jobsCount: number;
}

export interface EarningsChartProps {
  data?: EarningsDataPoint[];
  totalEarnings?: number;
  completedJobsCount?: number;
  currency?: string;
}

const defaultMonthlyData: EarningsDataPoint[] = [
  { label: "May", amount: 12500, jobsCount: 8 },
  { label: "Jun", amount: 18200, jobsCount: 12 },
  { label: "Jul", amount: 15400, jobsCount: 10 },
  { label: "Aug", amount: 22800, jobsCount: 15 },
  { label: "Sep", amount: 28500, jobsCount: 19 },
  { label: "Oct", amount: 19300, jobsCount: 13 },
];

/**
 * EarningsChart Component
 *
 * Moved to @/features/booking/components/EarningsChart per Dev B architecture.
 * Consumed by @/app/(worker)/earnings/page.tsx to visualize earnings and job metrics.
 */
export function EarningsChart({
  data = defaultMonthlyData,
  totalEarnings = 116700,
  completedJobsCount = 77,
  currency = "ETB",
}: EarningsChartProps) {
  const [activeTab, setActiveTab] = useState<"monthly" | "weekly">("monthly");

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" />
            Total Revenue
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalEarnings.toLocaleString()} <span className="text-sm font-medium text-gray-500">{currency}</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% vs last period
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            Jobs Completed
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {completedJobsCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Verified customer bookings</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            Avg. Ticket Size
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {completedJobsCount > 0
              ? Math.round(totalEarnings / completedJobsCount).toLocaleString()
              : 0}{" "}
            <span className="text-sm font-medium text-gray-500">{currency}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Per completed booking</p>
        </div>
      </div>

      {/* Chart Header & Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Earnings Overview</h3>
          <p className="text-xs text-gray-500">Gross revenue generated through completed service bookings</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "monthly"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "weekly"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Bar Chart Canvas */}
      <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-2">
        {data.map((item, index) => {
          const heightPercent = Math.round((item.amount / maxAmount) * 100);
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center h-full justify-end group"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none text-center shadow-lg whitespace-nowrap z-10">
                <p className="font-semibold">{item.amount.toLocaleString()} {currency}</p>
                <p className="text-gray-300">{item.jobsCount} jobs</p>
              </div>

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-gray-100 rounded-t-md relative overflow-hidden flex items-end">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-primary hover:bg-primary-dark transition-all rounded-t-md"
                />
              </div>

              {/* Label */}
              <span className="text-xs font-medium text-gray-500 mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EarningsChart;
