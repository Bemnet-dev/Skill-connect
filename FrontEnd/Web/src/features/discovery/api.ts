import { apiClient, RequestOptions, QueryParamValue } from "@/lib/api-client";
import {
  searchFiltersSchema,
  searchResultsSchema,
  type SearchFilters,
  type SearchResults,
} from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Discovery Feature API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Methods for discovering, querying, and retrieving skilled workers.
 */

/**
 * Builds standard query parameter dictionary from validated search filters.
 *
 * @param filters - Raw or partial search filters
 * @returns Serialized flat dictionary ready for apiClient URLSearchParams builder
 */
export function buildSearchQueryParams(
  filters?: Partial<SearchFilters>
): Record<string, QueryParamValue> {
  const validated = searchFiltersSchema.parse(filters ?? {});
  const params: Record<string, QueryParamValue> = {};

  // 1. Skill Category
  if (validated.category) {
    params.category = validated.category;
  }

  // 2. Geolocation Search Origin
  if (validated.origin) {
    params.latitude = validated.origin.latitude;
    params.longitude = validated.origin.longitude;
    // Common aliases for backend query parsers
    params.lat = validated.origin.latitude;
    params.lng = validated.origin.longitude;

    if (validated.origin.address) {
      params.address = validated.origin.address;
    }
    if (validated.origin.city) {
      params.city = validated.origin.city;
    }
  }

  // 3. Search Radius in Kilometers
  if (validated.radius !== undefined) {
    params.radius = validated.radius;
    params.radiusKm = validated.radius;
  }

  // 4. Availability Filter
  if (validated.availability && validated.availability !== "any") {
    params.availability = validated.availability;
  }

  // 5. Free-Text Keyword / Query
  if (validated.query) {
    params.query = validated.query;
    params.q = validated.query;
  }

  // 6. Rating & Price Constraints
  if (validated.minRating !== undefined) {
    params.minRating = validated.minRating;
  }
  if (validated.minPrice !== undefined) {
    params.minPrice = validated.minPrice;
  }
  if (validated.maxPrice !== undefined) {
    params.maxPrice = validated.maxPrice;
  }

  // 7. Identity Verification Filter
  if (validated.isVerified !== undefined) {
    params.isVerified = validated.isVerified;
  }

  // 8. Sorting Criteria
  if (validated.sortBy) {
    params.sortBy = validated.sortBy;
  }

  // 9. Pagination Parameters
  if (validated.page !== undefined) {
    params.page = validated.page;
  }
  if (validated.pageSize !== undefined) {
    params.pageSize = validated.pageSize;
    params.limit = validated.pageSize;
  }

  return params;
}

/**
 * Searches and discovers skilled workers according to location, category,
 * availability, and filtering criteria.
 *
 * 1. Validates and serializes query filters.
 * 2. Issues GET request to `/workers/search`.
 * 3. Validates the response array through `searchResultsSchema` before returning.
 *
 * @param filters - Search query parameters (category, origin, radius, availability, etc.)
 * @param options - Optional HTTP client configuration (timeout, signal, headers)
 * @returns Validated array of worker summary cards
 */
export async function searchWorkers(
  filters?: Partial<SearchFilters>,
  options?: Omit<RequestOptions, "method">
): Promise<SearchResults> {
  const queryParams = buildSearchQueryParams(filters);

  const response = await apiClient.get<unknown>("/workers/search", {
    ...options,
    params: {
      ...queryParams,
      ...(options?.params || {}),
    },
  });

  // Extract array payload if enclosed in an envelope { items: [...] } or { data: [...] }
  const payload =
    Array.isArray(response)
      ? response
      : response && typeof response === "object" && "items" in response && Array.isArray((response as { items: unknown }).items)
      ? (response as { items: unknown[] }).items
      : response && typeof response === "object" && "data" in response && Array.isArray((response as { data: unknown }).data)
      ? (response as { data: unknown[] }).data
      : response;

  return searchResultsSchema.parse(payload);
}
