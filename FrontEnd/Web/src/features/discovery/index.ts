/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Discovery Feature Public API Barrel
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical single import path for worker discovery, search, filtering, and map:
 * - Schemas: searchFiltersSchema, workerSummarySchema, searchResultsSchema,
 *            paginatedSearchResultsSchema, searchOriginSchema, searchAvailabilitySchema
 * - API Functions: searchWorkers, buildSearchQueryParams
 * - Hooks: useSearchWorkers
 * - Components: WorkerCard, ResultsMap
 * - Types: SearchFilters, WorkerSummary, SearchResults, PaginatedSearchResults,
 *          SearchOrigin, SearchAvailability, UseSearchWorkersOptions,
 *          WorkerCardProps, ResultsMapProps
 *
 * @example
 * ```ts
 * import {
 *   searchFiltersSchema,
 *   workerSummarySchema,
 *   searchWorkers,
 *   useSearchWorkers,
 *   WorkerCard,
 *   ResultsMap,
 *   type SearchFilters,
 *   type WorkerSummary,
 *   type SearchResults,
 * } from "@/features/discovery";
 * ```
 */

// ── 1. Validation Schemas ─────────────────────────────────────────────────────
export {
  searchFiltersSchema,
  workerSummarySchema,
  searchResultsSchema,
  paginatedSearchResultsSchema,
  searchOriginSchema,
  searchAvailabilitySchema,
} from "./schema";

// ── 2. API Functions ──────────────────────────────────────────────────────────
export {
  searchWorkers,
  buildSearchQueryParams,
} from "./api";

// ── 3. React Hooks ────────────────────────────────────────────────────────────
export {
  useSearchWorkers,
} from "./hooks";

// ── 4. UI Components ──────────────────────────────────────────────────────────
export {
  WorkerCard,
  ResultsMap,
} from "./components";

// ── 5. Type Definitions & Inferred Schemas ────────────────────────────────────
export type {
  SearchFilters,
  WorkerSummary,
  SearchResults,
  PaginatedSearchResults,
  SearchOrigin,
  SearchAvailability,
} from "./schema";

export type {
  UseSearchWorkersOptions,
} from "./hooks";

export type {
  WorkerCardProps,
  ResultsMapProps,
} from "./components";
