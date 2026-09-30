"use client";

import React, { useState } from "react";
import { Briefcase, Filter, Search, Tag } from "lucide-react";
import { useOpenJobRequests } from "@/features/quotation/hooks/useJobRequests";
import { JobRequestCard } from "@/features/quotation/components/JobRequestCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function WorkerJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: openJobs, isLoading, isError, refetch } = useOpenJobRequests();

  const filteredJobs = (openJobs || []).filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.description.toLowerCase().includes(q) ||
      job.address.toLowerCase().includes(q) ||
      (job.categoryName && job.categoryName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Available Job Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review open requests posted by customers across Addis Ababa and submit competitive quotes.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, sub-city, or trade (e.g. plumbing, Bole)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
            >
              <Skeleton className="h-5 w-1/3 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700 mb-2">
            Failed to load job requests.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-primary underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredJobs.length === 0 && (
        <EmptyState
          title="No open jobs match your search"
          description="Try adjusting your search criteria or check back later for newly submitted requests."
        />
      )}

      {/* Jobs Grid */}
      {!isLoading && !isError && filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobRequestCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
