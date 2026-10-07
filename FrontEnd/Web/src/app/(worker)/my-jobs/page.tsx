"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Search,
  Plus,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { useMyQuotes } from "@/features/quotation/hooks/useQuotes";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";

type StatusFilter = "all" | "Pending" | "Accepted" | "Rejected" | "Expired";

export default function WorkerMyJobsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: quotes, isLoading, isError, refetch } = useMyQuotes();

  const filteredQuotes = (quotes || []).filter((q) => {
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.workerName?.toLowerCase().includes(query) ||
      q.message?.toLowerCase().includes(query)
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="warning">Pending</Badge>;
      case "Accepted":
        return <Badge variant="success">Accepted</Badge>;
      case "Rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "Expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / 10));
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Quotes ({quotes?.length || 0})
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all quotes you&apos;ve submitted to customers.
          </p>
        </div>
        <Link href="/jobs">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Submit New Quote
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job, message..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Quotes</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
            >
              <Skeleton className="h-5 w-1/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-1/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700 mb-2">Failed to load quotes.</p>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-primary underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredQuotes.length === 0 && (
        <EmptyState
          title="No quotes found"
          description={
            statusFilter === "all"
              ? "You haven't submitted any quotes yet."
              : `You have no ${statusFilter.toLowerCase()} quotes.`
          }
          action={
            <Link href="/jobs">
              <Button size="sm" variant="primary">
                Browse Jobs
              </Button>
            </Link>
          }
        />
      )}

      {/* Quotes Table */}
      {!isLoading && !isError && filteredQuotes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">
                            Job #{quote.jobRequestId}
                          </span>
                          <span className="text-xs text-gray-400">
                            {quote.message?.slice(0, 30) || "No message"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(quote.status)}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {quote.price.toLocaleString()} {quote.currency || "ETB"}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/quotes/${quote.id}`);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                        <button className="p-1 rounded hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-primary text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
