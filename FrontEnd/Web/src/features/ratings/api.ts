import { apiClient } from "@/lib/api-client";
import { type CreateReviewInput, type Review } from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Reviews & Ratings API Client
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function submitReview(
  data: CreateReviewInput,
  options?: { signal?: AbortSignal }
): Promise<Review> {
  return apiClient.post<Review>("/api/reviews", data, options);
}

export async function getWorkerReviews(
  workerProfileId: number | string,
  options?: { signal?: AbortSignal }
): Promise<Review[]> {
  return apiClient.get<Review[]>(
    `/api/reviews/worker/${workerProfileId}`,
    options
  );
}

export async function getBookingReviews(
  bookingId: number | string,
  options?: { signal?: AbortSignal }
): Promise<Review[]> {
  return apiClient.get<Review[]>(
    `/api/reviews/booking/${bookingId}`,
    options
  );
}
