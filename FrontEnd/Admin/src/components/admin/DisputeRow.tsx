"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, X, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface DisputeData {
  id: number;
  bookingId: number;
  raisedById: string;
  raisedByName: string;
  reason: string;
  status: "Open" | "Resolved" | "Dismissed";
  createdAt: string;
  resolvedAt?: string | null;
  resolution?: string | null;
}

export interface DisputeRowProps {
  dispute: DisputeData;
  onResolved?: (id: number, resolution: string) => void;
}

/**
 * DisputeActionButtons (Client Island)
 */
export function DisputeActionButtons({
  disputeId,
  onResolved,
}: {
  disputeId: number;
  onResolved?: (id: number, resolution: string) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<"Open" | "Resolved" | "Dismissed">("Open");
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "Resolved" | "Dismissed") => {
    setIsPending(true);
    setError(null);
    try {
      setStatus(action);
      if (onResolved) onResolved(disputeId, action === "Resolved" ? "Dispute resolved in favor of customer" : "Dispute dismissed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process dispute";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (status !== "Open") {
    return (
      <Badge variant={status === "Resolved" ? "success" : "secondary"}>
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
          onClick={() => handleAction("Dismissed")}
          className="h-8 px-2.5 text-xs"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Dismiss
        </Button>
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={isPending}
          onClick={() => handleAction("Resolved")}
          className="h-8 px-3 text-xs"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Resolve
        </Button>
      </div>
    </div>
  );
}

/**
 * DisputeRow Component (Server-compatible with Client Island buttons)
 */
export function DisputeRow({
  dispute,
  onResolved,
}: DisputeRowProps) {
  const formattedDate = new Date(dispute.createdAt).toLocaleDateString(
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
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {dispute.raisedByName}
            </h4>
            <Badge variant="outline" size="sm">
              Booking #{dispute.bookingId}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Filed: {formattedDate} &bull; Dispute #{dispute.id}
          </p>
          <p className="text-xs text-gray-600 line-clamp-2">
            {dispute.reason}
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        {dispute.status === "Open" ? (
          <DisputeActionButtons
            disputeId={dispute.id}
            onResolved={onResolved}
          />
        ) : (
          <Badge
            variant={
              dispute.status === "Resolved" ? "success" : "secondary"
            }
          >
            {dispute.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default DisputeRow;
