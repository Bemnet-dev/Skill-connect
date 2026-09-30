import { apiClient } from "@/lib/api-client";
import {
  type CreatePaymentInput,
  type PaymentRecord,
  type PaymentStatus,
} from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Payments API Client
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function createPayment(
  data: CreatePaymentInput,
  options?: { signal?: AbortSignal }
): Promise<PaymentRecord> {
  return apiClient.post<PaymentRecord>("/api/payments", data, options);
}

export async function getPaymentById(
  id: number | string,
  options?: { signal?: AbortSignal }
): Promise<PaymentRecord> {
  return apiClient.get<PaymentRecord>(`/api/payments/${id}`, options);
}

export async function getBookingPayments(
  bookingId: number | string,
  options?: { signal?: AbortSignal }
): Promise<PaymentRecord[]> {
  return apiClient.get<PaymentRecord[]>(
    `/api/payments/booking/${bookingId}`,
    options
  );
}

export async function getWorkerPayments(
  workerProfileId: number | string,
  options?: { signal?: AbortSignal }
): Promise<PaymentRecord[]> {
  return apiClient.get<PaymentRecord[]>(
    `/api/payments/worker/${workerProfileId}`,
    options
  );
}

export async function updatePaymentStatus(
  id: number | string,
  status: PaymentStatus,
  options?: { signal?: AbortSignal }
): Promise<PaymentRecord> {
  return apiClient.patch<PaymentRecord>(
    `/api/payments/${id}/status`,
    { status },
    options
  );
}
