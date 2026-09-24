/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import {
  queryClient,
  createQueryClient,
  shouldRetryQuery,
  NON_RETRYABLE_STATUSES,
  getQueryRetryDelay,
} from "@/state/query/queryClient";
import { ApiError } from "@/lib/api-client";
import { STALE_TIME, API_RETRY } from "@/lib/constants";

describe("queryClient Configuration", () => {
  describe("Default Options", () => {
    it("sets default queries staleTime to STALE_TIME.DEFAULT (60s)", () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(STALE_TIME.DEFAULT);
      expect(defaultOptions.queries?.staleTime).toBe(60000);
    });

    it("disables refetchOnWindowFocus by default", () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it("disables retry on mutations to prevent duplicate actions", () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.mutations?.retry).toBe(false);
    });
  });

  describe("Non-Retryable HTTP Status Handling", () => {
    const nonRetryableCodes = [400, 401, 403, 404, 422];

    it("defines the exact set of non-retryable HTTP status codes", () => {
      nonRetryableCodes.forEach((status) => {
        expect(NON_RETRYABLE_STATUSES.has(status)).toBe(true);
      });
      expect(NON_RETRYABLE_STATUSES.size).toBe(5);
    });

    nonRetryableCodes.forEach((status) => {
      it(`does NOT retry ApiError with status ${status}`, () => {
        const error = new ApiError({
          status,
          statusText: `Error ${status}`,
          message: `Client error ${status}`,
        });

        // Even on the very first failure (failureCount: 1), it must NOT retry
        const shouldRetry = shouldRetryQuery(1, error);
        expect(shouldRetry).toBe(false);
      });

      it(`does NOT retry duck-typed error with status ${status}`, () => {
        const duckTypedError = { status, message: `Duck typed ${status}` };
        const shouldRetry = shouldRetryQuery(1, duckTypedError);
        expect(shouldRetry).toBe(false);
      });
    });
  });

  describe("Retryable Errors (Network, Timeouts, 5xx)", () => {
    it("retries 500 Internal Server Error when failureCount < MAX_ATTEMPTS", () => {
      const serverError = new ApiError({
        status: 500,
        statusText: "Internal Server Error",
        message: "Server crashed",
      });

      expect(shouldRetryQuery(1, serverError)).toBe(true);
      expect(shouldRetryQuery(2, serverError)).toBe(true);
      // Stops after reaching MAX_ATTEMPTS (3)
      expect(shouldRetryQuery(3, serverError)).toBe(false);
    });

    it("retries 502 Bad Gateway and 503 Service Unavailable", () => {
      const gatewayError = new ApiError({
        status: 502,
        statusText: "Bad Gateway",
        message: "Bad gateway",
      });
      expect(shouldRetryQuery(1, gatewayError)).toBe(true);

      const unavailableError = new ApiError({
        status: 503,
        statusText: "Service Unavailable",
        message: "Service unavailable",
      });
      expect(shouldRetryQuery(1, unavailableError)).toBe(true);
    });

    it("retries 408 Request Timeout and Network errors", () => {
      const timeoutError = new ApiError({
        status: 408,
        statusText: "Request Timeout",
        message: "Timed out",
      });
      expect(shouldRetryQuery(1, timeoutError)).toBe(true);

      const networkError = new Error("Failed to fetch");
      expect(shouldRetryQuery(1, networkError)).toBe(true);
    });

    it("stops retrying once failureCount reaches or exceeds API_RETRY.MAX_ATTEMPTS", () => {
      const networkError = new Error("Connection reset");
      expect(shouldRetryQuery(API_RETRY.MAX_ATTEMPTS, networkError)).toBe(false);
      expect(shouldRetryQuery(API_RETRY.MAX_ATTEMPTS + 1, networkError)).toBe(false);
    });
  });

  describe("getQueryRetryDelay", () => {
    it("calculates exponential backoff based on API_RETRY.BACKOFF_MS", () => {
      expect(getQueryRetryDelay(0)).toBe(API_RETRY.BACKOFF_MS); // 1000ms
      expect(getQueryRetryDelay(1)).toBe(API_RETRY.BACKOFF_MS * 2); // 2000ms
      expect(getQueryRetryDelay(2)).toBe(API_RETRY.BACKOFF_MS * 4); // 4000ms
    });

    it("caps exponential backoff at 30 seconds", () => {
      expect(getQueryRetryDelay(10)).toBe(30000);
    });
  });

  describe("createQueryClient Factory", () => {
    it("creates isolated QueryClient instances with matching configuration", () => {
      const client1 = createQueryClient();
      const client2 = createQueryClient();

      expect(client1).not.toBe(client2);
      expect(client1.getDefaultOptions().queries?.staleTime).toBe(
        STALE_TIME.DEFAULT
      );
      expect(client2.getDefaultOptions().queries?.staleTime).toBe(
        STALE_TIME.DEFAULT
      );
    });
  });
});
