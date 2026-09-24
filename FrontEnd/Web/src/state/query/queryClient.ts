import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api-client";
import { STALE_TIME, API_RETRY } from "@/lib/constants";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Non-Retryable HTTP Status Codes
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side errors where repeating the exact same request without modification
 * will never succeed (validation, missing resources, permissions, or auth).
 */
export const NON_RETRYABLE_STATUSES = new Set<number>([
  400, // Bad Request (invalid input/parameters)
  401, // Unauthorized (handled via silent refresh in api-client; if bubbling up, do not loop)
  403, // Forbidden (insufficient permissions)
  404, // Not Found (resource does not exist)
  422, // Unprocessable Entity (business validation failure)
]);

/**
 * Global Query Retry Strategy
 *
 * Determines whether a failed query should be retried.
 * Treats ApiError with statuses 400, 401, 403, 404, and 422 as non-retryable.
 * Retries network errors, 408 timeouts, and 5xx server errors up to MAX_ATTEMPTS.
 *
 * @param failureCount - Number of times the query has failed so far
 * @param error - The error thrown by queryFn
 * @returns boolean indicating whether to retry
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  // If the error is a typed ApiError with a non-retryable client status, stop immediately
  if (isApiError(error)) {
    if (NON_RETRYABLE_STATUSES.has(error.status)) {
      return false;
    }
  }

  // Support duck-typed status property for resilience across error types
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    const status = (error as { status: number }).status;
    if (NON_RETRYABLE_STATUSES.has(status)) {
      return false;
    }
  }

  // Allow retries up to centralized MAX_ATTEMPTS for transient errors (network, 5xx, timeouts)
  return failureCount < API_RETRY.MAX_ATTEMPTS;
}

/**
 * Exponential backoff delay calculation using centralized BACKOFF_MS
 */
export function getQueryRetryDelay(attemptIndex: number): number {
  return Math.min(API_RETRY.BACKOFF_MS * 2 ** attemptIndex, 30000);
}

/**
 * Factory function to create a new, isolated QueryClient instance.
 * Useful for SSR, Server Components, and isolated test suites.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.DEFAULT,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: getQueryRetryDelay,
      },
      mutations: {
        // Do not auto-retry mutations to prevent duplicate creates, orders, or charges
        retry: false,
      },
    },
  });
}

/**
 * Global shared QueryClient singleton used by Providers and hooks.
 */
export const queryClient = createQueryClient();

export default queryClient;
