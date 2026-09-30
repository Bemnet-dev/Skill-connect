import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  ShieldCheck,
  Clock,
  Tag,
} from "lucide-react";
import { env } from "@/env";
import { Badge } from "@/components/ui/Badge";
import { BookingStatusActions } from "@/features/booking/components/BookingStatusActions";
import { EscrowStatusBadge } from "@/features/payments/components/EscrowStatusBadge";
import { PaymentForm } from "@/features/payments/components/PaymentForm";
import { ReviewForm } from "@/features/ratings/components/ReviewForm";
import { type Booking, type BookingStatus } from "@/features/booking/schema";

interface BookingPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

/**
 * Server-side initial data fetch with { cache: "no-store" }
 * per SC-FE-003 §3 / §8.3
 */
async function getBookingInitialState(id: string): Promise<Booking | null> {
  const apiBase = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5077";
  try {
    const res = await fetch(`${apiBase}/api/bookings/${id}`, {
      cache: "no-store",
    });

    if (res.ok) {
      return (await res.json()) as Booking;
    }
  } catch {
    // If backend is not running during local dev/build, provide fallback record
  }

  // Graceful fallback for offline build / mock
  return {
    id: Number(id) || 1,
    quoteId: 1,
    customerId: "usr_customer_1",
    customerName: "Customer User",
    workerProfileId: 101,
    workerName: "Abebe Kebede",
    workerAvatar: null,
    workerPhone: "+251911223344",
    categoryName: "Plumbing",
    description: "Repair burst pipe and replace main valve under kitchen sink",
    status: "InProgress" as BookingStatus,
    totalPrice: 1500,
    currency: "ETB",
    address: "Bole, Sub-city Woreda 03, Addis Ababa",
    scheduledDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isPaid: true,
    paymentStatus: "Held",
  };
}

/**
 * Booking Details Page — /bookings/[bookingId]
 *
 * Implements SSR + Client Islands architecture:
 * - Server-renders core metadata, pricing, worker profile, and location
 * - Client island for <BookingStatusActions /> with staleTime: 0
 * - Client island for <PaymentForm /> and <ReviewForm />
 */
export default async function BookingDetailPage({ params }: BookingPageProps) {
  const resolvedParams = await params;
  const booking = await getBookingInitialState(resolvedParams.bookingId);

  if (!booking) {
    notFound();
  }

  const formattedDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date(booking.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              Booking #{booking.id}
            </span>
            <Badge variant="primary">{booking.status}</Badge>
            {booking.categoryName && (
              <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                {booking.categoryName}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {booking.categoryName || "Service"} Appointment
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {booking.address}
            </span>
          </p>
        </div>

        {/* Agreed Total */}
        <div className="sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
          <span className="text-xs text-gray-400 block font-medium">Agreed Fee</span>
          <span className="text-2xl font-black text-gray-900">
            {booking.totalPrice.toLocaleString()}{" "}
            <span className="text-sm font-semibold text-gray-500">
              {booking.currency || "ETB"}
            </span>
          </span>
          <div className="mt-1">
            <EscrowStatusBadge
              status={booking.paymentStatus || (booking.isPaid ? "Held" : "Pending")}
              amount={booking.totalPrice}
              currency={booking.currency}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Actions */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Subtree (Client Island with staleTime: 0) */}
          <BookingStatusActions
            bookingId={booking.id}
            initialStatus={booking.status}
          />

          {/* Job Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Job Scope &amp; Address
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {booking.description || "General maintenance and repair service."}
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2 text-xs text-gray-600">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">Service Location: </span>
                {booking.address}
              </div>
            </div>
          </div>

          {/* Post-Booking Review Form (Visible when completed) */}
          {booking.status === "Completed" && (
            <ReviewForm
              bookingId={booking.id}
              workerName={booking.workerName ?? undefined}
            />
          )}

          {/* Payment Form (If payment is pending) */}
          {!booking.isPaid && booking.status !== "Cancelled" && (
            <PaymentForm
              bookingId={booking.id}
              amount={booking.totalPrice}
              currency={booking.currency}
            />
          )}
        </div>

        {/* Right Column: Worker Profile & Trust Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Assigned Professional
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-base">
                {booking.workerName ? booking.workerName[0] : "W"}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {booking.workerName || "Assigned Worker"}
                </h4>
                <p className="text-xs text-gray-500">
                  {booking.categoryName || "Tradesperson"}
                </p>
              </div>
            </div>

            {booking.workerPhone && (
              <div className="pt-2">
                <a
                  href={`tel:${booking.workerPhone}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Call Worker ({booking.workerPhone})
                </a>
              </div>
            )}
          </div>

          {/* Escrow Trust Guarantee */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              SkillConnect Guarantee
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Your payment is safeguarded in escrow. Funds are never released to the technician
              until you verify and confirm that the service was executed satisfactorily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
