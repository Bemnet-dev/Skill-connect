import { apiClient } from "@/lib/api-client";
import {
  type Booking,
  type BookingStatus,
  type CreateBookingInput,
} from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Bookings API Client
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function createBooking(
  data: CreateBookingInput,
  options?: { signal?: AbortSignal }
): Promise<Booking> {
  return apiClient.post<Booking>("/api/bookings", data, options);
}

export async function getBookingById(
  id: number | string,
  options?: { signal?: AbortSignal }
): Promise<Booking> {
  return apiClient.get<Booking>(`/api/bookings/${id}`, options);
}

export async function getMyBookings(options?: {
  signal?: AbortSignal;
}): Promise<Booking[]> {
  return apiClient.get<Booking[]>("/api/bookings/my", options);
}

export async function getWorkerBookings(
  workerProfileId: number | string,
  options?: { signal?: AbortSignal }
): Promise<Booking[]> {
  return apiClient.get<Booking[]>(
    `/api/bookings/worker/${workerProfileId}`,
    options
  );
}

export async function updateBookingStatus(
  id: number | string,
  status: BookingStatus,
  options?: { signal?: AbortSignal }
): Promise<Booking> {
  return apiClient.patch<Booking>(
    `/api/bookings/${id}/status`,
    { status },
    options
  );
}
