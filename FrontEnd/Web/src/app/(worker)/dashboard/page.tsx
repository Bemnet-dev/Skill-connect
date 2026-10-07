"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  Eye,
  MoreVertical,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useMyQuotes } from "@/features/quotation/hooks/useQuotes";
import { useOpenJobRequests } from "@/features/quotation/hooks/useJobRequests";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function WorkerDashboardPage() {
  const router = useRouter();
  const { data: quotes, isLoading: quotesLoading } = useMyQuotes();
  const { data: openJobs, isLoading: jobsLoading } = useOpenJobRequests();

  const isLoading = quotesLoading || jobsLoading;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getQuoteStatusBadge = (status: string) => {
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

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "Accepted":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "Rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Expired":
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Hello, Worker
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is your daily activities and quotes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {(openJobs || []).length}
            </span>
            <p className="text-sm text-gray-500 mt-1">Open Jobs</p>
          </div>
          <div className="p-3 rounded-lg bg-white text-blue-600 shadow-sm">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {(quotes || []).length}
            </span>
            <p className="text-sm text-gray-500 mt-1">My Quotes</p>
          </div>
          <div className="p-3 rounded-lg bg-white text-amber-600 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/post-a-job">
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Post a Job
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline">
            <Briefcase className="w-4 h-4" />
            Find Jobs
          </Button>
        </Link>
        <Link href="/my-jobs">
          <Button variant="outline">
            <FileText className="w-4 h-4" />
            My Quotes
          </Button>
        </Link>
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

      {/* Empty State */}
      {!isLoading && (quotes || []).length === 0 && (
        <EmptyState
          title="No quotes yet"
          description="Browse open jobs and submit your first quote."
          action={
            <Link href="/jobs">
              <Button size="sm" variant="primary">
                <Plus className="w-4 h-4" />
                Browse Jobs
              </Button>
            </Link>
          }
        />
      )}

      {/* Recent Quotes Table */}
      {!isLoading && (quotes || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">Recent Quotes</h3>
            <Link
              href="/quotes"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
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
                {(quotes || []).slice(0, 5).map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getQuoteStatusIcon(quote.status)}
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
                    <td className="px-5 py-4">{getQuoteStatusBadge(quote.status)}</td>
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
        </div>
      )}
    </div>
  );
}
