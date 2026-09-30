"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";

export interface DisputeData {
  id: number;
  bookingId: number;
  raisedById: string;
  raisedByName?: string;
  reason: string;
  status: "Open" | "Resolved" | "Dismissed";
  resolution?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface DisputeRowProps {
  dispute: DisputeData;
  onResolved?: (id: number, resolution: string) => void;
}

export function DisputeActionButtons({
  disputeId,
  onResolved,
}: {
  disputeId: number;
  onResolved?: (id: number, resolution: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionText.trim()) return;

    setIsPending(true);
    setError(null);
    try {
      await apiClient.patch(`/api/disputes/${disputeId}/resolve`, {
        resolution: resolutionText,
      });
      setIsResolved(true);
      setIsOpen(false);
      if (onResolved) onResolved(disputeId, resolutionText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resolve dispute";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (isResolved) {
    return <Badge variant="success">Resolved</Badge>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs h-8 px-3"
      >
        {isOpen ? "Close" : "Resolve Dispute"}
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 ml-1" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-1" />
        )}
      </Button>

      {isOpen && (
        <form
          onSubmit={handleResolve}
          className="mt-2 w-72 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left space-y-2 shadow-md"
        >
          <label className="block text-[11px] font-semibold text-gray-700">
            Resolution Summary
          </label>
          <textarea
            rows={2}
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="e.g. 50% refund issued to customer via Telebirr..."
            className="w-full text-xs rounded border border-gray-300 p-2 focus:outline-none focus:border-primary"
            required
          />
          {error && <p className="text-[10px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-[11px] h-7 px-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={isPending}
              className="text-[11px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * DisputeRow Component (Server-compatible with Client Island resolution island)
 */
export function DisputeRow({ dispute, onResolved }: DisputeRowProps) {
  const formattedDate = new Date(dispute.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="p-2.5 rounded-lg bg-red-50 text-red-600 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              Dispute #{dispute.id} &bull; Booking #{dispute.bookingId}
            </h4>
            <Badge
              variant={dispute.status === "Open" ? "danger" : "success"}
              size="sm"
            >
              {dispute.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Raised: {formattedDate} &bull; By: {dispute.raisedByName || dispute.raisedById}
          </p>
          <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 border border-gray-100">
            <span className="font-medium text-gray-900">Claim Reason: </span>
            {dispute.reason}
          </div>
          {dispute.resolution && (
            <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 rounded p-2 border border-emerald-100">
              <span className="font-semibold">Resolution: </span>
              {dispute.resolution}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end sm:pt-1">
        {dispute.status === "Open" ? (
          <DisputeActionButtons
            disputeId={dispute.id}
            onResolved={onResolved}
          />
        ) : (
          <Badge variant="success">Resolved</Badge>
        )}
      </div>
    </div>
  );
}

export default DisputeRow;
