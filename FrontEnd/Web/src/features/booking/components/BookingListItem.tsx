import React from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, User } from "lucide-react";
import { type Booking, type BookingStatus } from "../schema";
import { Badge } from "@/components/ui/Badge";

export interface BookingListItemProps {
  booking: Booking;
  perspective?: "customer" | "worker";
}

/**
 * BookingListItem Component (Server-compatible)
 *
 * Renders a compact, accessible booking summary row.
 * Designed to run without client JavaScript overhead on server-rendered lists.
 */
export function BookingListItem({
  booking,
  perspective = "customer",
}: BookingListItemProps) {
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "Confirmed":
        return <Badge variant="primary">Confirmed</Badge>;
      case "CheckedIn":
        return <Badge variant="secondary">Checked In</Badge>;
      case "InProgress":
        return <Badge variant="warning">In Progress</Badge>;
      case "Completed":
        return <Badge variant="success">Completed</Badge>;
      case "Disputed":
        return <Badge variant="danger">Disputed</Badge>;
      case "Cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const counterpartyName =
    perspective === "customer"
      ? booking.workerName || "Assigned Worker"
      : booking.customerName || "Customer";

  const formattedDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-US", {
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Primary Booking Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          {getStatusBadge(booking.status)}
          <span className="text-xs font-mono text-gray-500">
            #{booking.id}
          </span>
          {booking.categoryName && (
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
              {booking.categoryName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <h4 className="font-semibold text-gray-900 text-base truncate">
            {counterpartyName}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {booking.address}
          </span>
        </div>
      </div>

      {/* Financials & Action Link */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 shrink-0 gap-2">
        <div className="text-right">
          <span className="text-xs text-gray-400 block">Total Agreed</span>
          <span className="font-bold text-gray-900 text-lg">
            {booking.totalPrice.toLocaleString()}{" "}
            <span className="text-xs font-medium text-gray-500">
              {booking.currency || "ETB"}
            </span>
          </span>
        </div>

        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default BookingListItem;
