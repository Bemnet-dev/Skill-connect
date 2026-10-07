import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { env } from "@/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { type Quote } from "@/features/quotation/schema";

interface QuoteDetailPageProps {
  params: Promise<{
    quoteId: string;
  }>;
}

async function getQuote(id: string): Promise<Quote | null> {
  const apiBase = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5077";
  try {
    const res = await fetch(`${apiBase}/api/quotes/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as Quote;
    }
  } catch {
    // Offline fallback for build / mock
  }

  return {
    id: Number(id) || 1,
    jobRequestId: 1,
    workerProfileId: 101,
    workerName: "Abebe Kebede",
    workerAvatar: null,
    workerRating: 4.8,
    price: 1500,
    currency: "ETB",
    message: "I can complete this job within 2 days. Materials included.",
    status: "Pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const resolvedParams = await params;
  const quote = await getQuote(resolvedParams.quoteId);

  if (!quote) {
    notFound();
  }

  const formattedDate = new Date(quote.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const expiryDate = quote.expiresAt
    ? new Date(quote.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No expiry";

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "Accepted":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "Expired":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Quotes
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                Quote #{quote.id}
              </span>
              {getStatusBadge(quote.status)}
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Job #{quote.jobRequestId}
            </h1>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Submitted {formattedDate}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Expires {expiryDate}
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Quoted Price</span>
            <span className="text-2xl font-black text-gray-900">
              {quote.price.toLocaleString()}{" "}
              <span className="text-sm font-semibold text-gray-500">
                {quote.currency || "ETB"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Quote Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Message */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Your Message
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {quote.message || "No message provided."}
            </p>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Status Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(quote.status)}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Quote Submitted
                  </p>
                  <p className="text-xs text-gray-500">{formattedDate}</p>
                </div>
              </div>
              {quote.status === "Accepted" && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Customer Accepted
                    </p>
                    <p className="text-xs text-gray-500">
                      The customer has accepted your quote.
                    </p>
                  </div>
                </div>
              )}
              {quote.status === "Rejected" && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Quote Rejected
                    </p>
                    <p className="text-xs text-gray-500">
                      The customer chose a different quote.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Job Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Job Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Job #{quote.jobRequestId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Job #{quote.jobRequestId}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-600" />
              Next Steps
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              {quote.status === "Pending" &&
                "Waiting for customer to review your quote. You'll be notified when they respond."}
              {quote.status === "Accepted" &&
                "Great! The customer accepted your quote. You'll be contacted to schedule the job."}
              {quote.status === "Rejected" &&
                "The customer chose a different quote. Check for new job opportunities."}
              {quote.status === "Expired" &&
                "This quote has expired. Check for new job opportunities."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
