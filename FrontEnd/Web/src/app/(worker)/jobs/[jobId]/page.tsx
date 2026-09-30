import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { env } from "@/env";
import { Badge } from "@/components/ui/Badge";
import { QuoteComposer } from "@/features/quotation/components/QuoteComposer";
import { type JobRequest } from "@/features/quotation/schema";

interface JobDetailPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

async function getJobRequest(id: string): Promise<JobRequest | null> {
  const apiBase = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5077";
  try {
    const res = await fetch(`${apiBase}/api/jobrequests/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as JobRequest;
    }
  } catch {
    // Offline fallback for build / mock
  }

  return {
    id: Number(id) || 1,
    customerId: "cust_123",
    customerName: "Bethlehem Tadesse",
    categoryId: 1,
    categoryName: "Plumbing",
    description: "Emergency: Bathroom pipe leakage causing water damage. Need urgent inspection and pipe replacement.",
    address: "Bole Medhanialem, Addis Ababa",
    status: "Open",
    quotesCount: 2,
    createdAt: new Date().toISOString(),
  };
}

export default async function WorkerJobDetailPage({
  params,
}: JobDetailPageProps) {
  const resolvedParams = await params;
  const job = await getJobRequest(resolvedParams.jobId);

  if (!job) {
    notFound();
  }

  const formattedDate = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Available Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Job Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="success">Job Lead #{job.id}</Badge>
                {job.categoryName && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {job.categoryName}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              {job.description}
            </h1>

            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                {job.address}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {job.quotesCount} quotes submitted so far
              </span>
            </div>
          </div>

          {/* Embedded Quote Composer */}
          <div>
            <QuoteComposer jobRequestId={job.id} />
          </div>
        </div>

        {/* Right Column: Tips & Safety */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Quote Best Practices</h3>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
              <li>Include transportation and material estimates if applicable.</li>
              <li>Specify your availability and estimated hours to finish.</li>
              <li>Keep prices transparent in Ethiopian Birr (ETB).</li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Guaranteed Payment
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              When a customer accepts your quote, the funds are deposited into escrow before you begin work, ensuring guaranteed settlement on completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
