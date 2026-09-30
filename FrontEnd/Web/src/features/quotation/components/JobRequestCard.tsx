import React from "react";
import Link from "next/link";
import { MapPin, Clock, FileText, ArrowRight, Tag } from "lucide-react";
import { type JobRequest } from "../schema";
import { Badge } from "@/components/ui/Badge";

export interface JobRequestCardProps {
  job: JobRequest;
  actionHref?: string;
  actionLabel?: string;
}

/**
 * JobRequestCard Component (Server-compatible)
 *
 * Renders a job lead card with service details, location, status, and quote count.
 * Uses Next.js <Link> for navigation, requiring zero client-side JavaScript overhead.
 */
export function JobRequestCard({
  job,
  actionHref,
  actionLabel = "View Job & Submit Quote",
}: JobRequestCardProps) {
  const targetHref = actionHref ?? `/jobs/${job.id}`;

  const formattedDate = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Open":
        return "success";
      case "Quoted":
        return "primary";
      case "Assigned":
        return "secondary";
      case "Closed":
        return "outline";
      case "Cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(job.status)} size="sm">
              {job.status}
            </Badge>
            {job.categoryName && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                <Tag className="w-3 h-3 text-gray-500" />
                {job.categoryName}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">
          {job.description.slice(0, 60)}
          {job.description.length > 60 ? "..." : ""}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {job.description}
        </p>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {job.address || "Addis Ababa"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            {job.quotesCount} {job.quotesCount === 1 ? "quote" : "quotes"} submitted
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          ID: #{job.id}
        </span>
        <Link
          href={targetHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default JobRequestCard;
