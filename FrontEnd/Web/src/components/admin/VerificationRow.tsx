"use client";

import React, { useState } from "react";
import { ShieldCheck, Check, X, FileText, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";

export interface VerificationSubmissionData {
  id: number;
  workerProfileId: number;
  workerName?: string;
  documentType: string;
  documentUrl: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
  reviewedAt?: string | null;
  resolution?: string | null;
}

export interface VerificationRowProps {
  submission: VerificationSubmissionData;
  onReviewed?: (id: number, status: "Approved" | "Rejected") => void;
}

/**
 * VerificationActionButtons (Client Island)
 */
export function VerificationActionButtons({
  submissionId,
  onReviewed,
}: {
  submissionId: number;
  onReviewed?: (id: number, status: "Approved" | "Rejected") => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [error, setError] = useState<string | null>(null);

  const handleReview = async (reviewStatus: "Approved" | "Rejected") => {
    setIsPending(true);
    setError(null);
    try {
      await apiClient.patch(`/api/verification/${submissionId}/review`, {
        status: reviewStatus,
        resolution: reviewStatus === "Approved" ? "Document verified" : "Document rejected",
      });
      setStatus(reviewStatus);
      if (onReviewed) onReviewed(submissionId, reviewStatus);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to review submission";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (status !== "Pending") {
    return (
      <Badge variant={status === "Approved" ? "success" : "danger"}>
        {status}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-[11px] text-red-600">{error}</span>}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleReview("Rejected")}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 px-2.5 text-xs"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Reject
        </Button>
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={isPending}
          onClick={() => handleReview("Approved")}
          className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-xs"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Approve
        </Button>
      </div>
    </div>
  );
}

/**
 * VerificationRow Component (Server-compatible with Client Island buttons)
 *
 * Renders national ID or trade license verification row in the Admin Queue.
 */
export function VerificationRow({
  submission,
  onReviewed,
}: VerificationRowProps) {
  const formattedDate = new Date(submission.submittedAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-gray-100 text-gray-600 shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {submission.workerName || `Worker #${submission.workerProfileId}`}
            </h4>
            <Badge variant="secondary" size="sm">
              {submission.documentType}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Submitted: {formattedDate} &bull; ID: #{submission.id}
          </p>
          <a
            href={submission.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            Inspect Document <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        {submission.status === "Pending" ? (
          <VerificationActionButtons
            submissionId={submission.id}
            onReviewed={onReviewed}
          />
        ) : (
          <Badge
            variant={
              submission.status === "Approved" ? "success" : "danger"
            }
          >
            {submission.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default VerificationRow;
