import { apiClient } from "@/lib/api-client";
import {
  type CreateJobRequestInput,
  type JobRequest,
  type JobRequestStatus,
  type CreateQuoteInput,
  type Quote,
  type QuoteStatus,
  type CounterOfferInput,
} from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Quotations & Job Requests API Client
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function createJobRequest(
  data: CreateJobRequestInput,
  options?: { signal?: AbortSignal }
): Promise<JobRequest> {
  return apiClient.post<JobRequest>("/api/jobrequests", data, options);
}

export async function getJobRequestById(
  id: number | string,
  options?: { signal?: AbortSignal }
): Promise<JobRequest> {
  return apiClient.get<JobRequest>(`/api/jobrequests/${id}`, options);
}

export async function getMyJobRequests(options?: {
  signal?: AbortSignal;
}): Promise<JobRequest[]> {
  return apiClient.get<JobRequest[]>("/api/jobrequests/my", options);
}

export async function getOpenJobRequests(options?: {
  signal?: AbortSignal;
}): Promise<JobRequest[]> {
  return apiClient.get<JobRequest[]>("/api/jobrequests/open", options);
}

export async function updateJobRequestStatus(
  id: number | string,
  status: JobRequestStatus,
  options?: { signal?: AbortSignal }
): Promise<JobRequest> {
  return apiClient.patch<JobRequest>(
    `/api/jobrequests/${id}/status`,
    { status },
    options
  );
}

export async function submitQuote(
  data: CreateQuoteInput,
  options?: { signal?: AbortSignal }
): Promise<Quote> {
  return apiClient.post<Quote>("/api/quotes", data, options);
}

export async function getQuoteById(
  id: number | string,
  options?: { signal?: AbortSignal }
): Promise<Quote> {
  return apiClient.get<Quote>(`/api/quotes/${id}`, options);
}

export async function getMyQuotes(options?: {
  signal?: AbortSignal;
}): Promise<Quote[]> {
  return apiClient.get<Quote[]>("/api/quotes/my", options);
}

export async function getQuotesForJobRequest(
  jobRequestId: number | string,
  options?: { signal?: AbortSignal }
): Promise<Quote[]> {
  return apiClient.get<Quote[]>(
    `/api/quotes/job-request/${jobRequestId}`,
    options
  );
}

export async function updateQuoteStatus(
  id: number | string,
  status: QuoteStatus,
  options?: { signal?: AbortSignal }
): Promise<Quote> {
  return apiClient.patch<Quote>(`/api/quotes/${id}/status`, { status }, options);
}

export async function submitCounterOffer(
  data: CounterOfferInput,
  options?: { signal?: AbortSignal }
): Promise<Quote> {
  return apiClient.post<Quote>(
    `/api/quotes/${data.quoteId}/counter`,
    data,
    options
  );
}
