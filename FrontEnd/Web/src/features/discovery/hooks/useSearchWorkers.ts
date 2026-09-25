"use client";

import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { searchWorkers } from "../api";
import { type SearchFilters, type SearchResults } from "../schema";
import { queryKeys } from "@/state/query/queryKeys";
import { STALE_TIME } from "@/lib/constants";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useSearchWorkers Hook
 * ─────────────────────────────────────────────────────────────────────────────
 * Discovery query hook that searches and filters skilled workers.
 *
 * The query key includes the full `filters` object (`["discovery", "search", filters]`),
 * guaranteeing that every distinct filter combination (category, origin coordinates,
 * radius, availability, price range, rating, pagination) caches independently in
 * TanStack Query cache.
 */

export type UseSearchWorkersOptions = Omit<
  UseQueryOptions<SearchResults, Error>,
  "queryKey" | "queryFn"
>;

/**
 * React hook to search and discover skilled workers with caching.
 *
 * @param filters - Discovery query parameters (category, origin, radius, availability, etc.)
 * @param options - Additional TanStack query options (enabled, staleTime, etc.)
 * @returns TanStack Query result containing array of WorkerSummary cards
 *
 * @example
 * ```tsx
 * const { data: workers, isLoading, isError } = useSearchWorkers({
 *   category: "plumbing",
 *   radius: 25,
 *   availability: "available_now",
 * });
 * ```
 */
export function useSearchWorkers(
  filters?: Partial<SearchFilters>,
  options?: UseSearchWorkersOptions
): UseQueryResult<SearchResults, Error> {
  return useQuery<SearchResults, Error>({
    queryKey: queryKeys.discovery.search(filters),
    queryFn: ({ signal }) => searchWorkers(filters, { signal }),
    staleTime: STALE_TIME.MEDIUM,
    placeholderData: keepPreviousData,
    ...options,
  });
}

export default useSearchWorkers;
