import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { env } from "@/env";
import { DisputeRow, type DisputeData } from "@/components/admin/DisputeRow";

async function getOpenDisputes(): Promise<DisputeData[]> {
  const apiBase = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5077";
  try {
    const res = await fetch(`${apiBase}/api/disputes/open`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as DisputeData[];
    }
  } catch {
    // Offline fallback for build / mock
  }

  return [
    {
      id: 501,
      bookingId: 42,
      raisedById: "usr_cust_88",
      raisedByName: "Tewodros Girma",
      reason: "Technician arrived 3 hours late and did not replace the faulty seal as agreed in the quote.",
      status: "Open",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 502,
      bookingId: 38,
      raisedById: "usr_worker_15",
      raisedByName: "Yonas Mekonnen (Worker)",
      reason: "Customer refusing to confirm completion after electrical wiring inspection was finished.",
      status: "Open",
      createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    },
  ];
}

export default async function AdminDisputesPage() {
  const disputes = await getOpenDisputes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dispute Resolution Desk
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Arbitrate disagreements between customers and technicians regarding escrow disbursements and job scopes.
        </p>
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {disputes.map((dispute) => (
          <DisputeRow key={dispute.id} dispute={dispute} />
        ))}

        {disputes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No active disputes filed. All engagements are in good standing!
          </div>
        )}
      </div>
    </div>
  );
}
