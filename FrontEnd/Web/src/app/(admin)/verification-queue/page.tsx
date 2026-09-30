import React from "react";
import { ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { env } from "@/env";
import { VerificationRow, type VerificationSubmissionData } from "@/components/admin/VerificationRow";

async function getPendingVerifications(): Promise<VerificationSubmissionData[]> {
  const apiBase = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5077";
  try {
    const res = await fetch(`${apiBase}/api/verification/pending`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as VerificationSubmissionData[];
    }
  } catch {
    // Offline fallback for build / mock
  }

  return [
    {
      id: 101,
      workerProfileId: 12,
      workerName: "Dawit Haile",
      documentType: "National ID (Kebele / Fayda)",
      documentUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800",
      status: "Pending",
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 102,
      workerProfileId: 19,
      workerName: "Kassahun Tadesse",
      documentType: "Trade License (MoTI Ethiopia)",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
      status: "Pending",
      submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 103,
      workerProfileId: 27,
      workerName: "Selamawit Bekele",
      documentType: "Vocational Certificate (TVET)",
      documentUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800",
      status: "Pending",
      submittedAt: new Date(Date.now() - 3600000 * 42).toISOString(),
    },
  ];
}

export default async function VerificationQueuePage() {
  const submissions = await getPendingVerifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Worker Verification Queue
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Review legal identification and professional certifications to grant Verified status on SkillConnect.
        </p>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {submissions.map((submission) => (
          <VerificationRow key={submission.id} submission={submission} />
        ))}

        {submissions.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            All submitted credentials have been reviewed. Queue is currently empty!
          </div>
        )}
      </div>
    </div>
  );
}
