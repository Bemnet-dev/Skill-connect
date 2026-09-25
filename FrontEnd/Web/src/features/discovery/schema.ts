import { z } from "zod";
import { idSchema, currencyCodeSchema } from "@/lib/validation/primitives";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Discovery Feature Validation Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical validation schemas for discovering, searching, and filtering
 * skilled workers across the platform:
 * - searchFiltersSchema: Query parameters for worker search (category, origin,
 *   radius, availability, pricing, rating, pagination).
 * - workerSummarySchema: Normalized payload required to render a search result
 *   card in worker listings, search results, and map views.
 * - searchResultsSchema: Paginated collection of worker search summaries.
 */

// ── 1. Search Origin & Coordinates ───────────────────────────────────────────

/**
 * Geolocation origin point representing the center of a geographic search.
 */
export const searchOriginSchema = z.object({
  latitude: z.coerce
    .number({
      required_error: "Latitude is required for origin",
      invalid_type_error: "Latitude must be a valid number",
    })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce
    .number({
      required_error: "Longitude is required for origin",
      invalid_type_error: "Longitude must be a valid number",
    })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(),
});

export type SearchOrigin = z.infer<typeof searchOriginSchema>;

// ── 2. Search Availability Filter ─────────────────────────────────────────────

export const searchAvailabilitySchema = z.enum([
  "any",
  "available_now",
  "today",
  "this_week",
]);

export type SearchAvailability = z.infer<typeof searchAvailabilitySchema>;

// ── 3. Search Filters Schema ──────────────────────────────────────────────────

/**
 * Validates search and filter query parameters for worker discovery.
 * Supports string coercion so URLSearchParams from Next.js router seamlessly parse.
 */
export const searchFiltersSchema = z.object({
  /** Skill category filter (e.g., 'plumbing', 'electrical') */
  category: z.string().trim().optional(),
  /** Geolocation search center */
  origin: searchOriginSchema.optional(),
  /** Search radius in kilometers (default: 25km, max: 500km) */
  radius: z.coerce
    .number()
    .positive("Radius must be greater than 0")
    .max(500, "Radius cannot exceed 500 km")
    .default(25),
  /** Worker availability filter */
  availability: searchAvailabilitySchema.default("any"),
  /** Free-text search query (matches name, skills, bio) */
  query: z.string().trim().max(200).optional(),
  /** Minimum star rating filter (0 to 5) */
  minRating: z.coerce.number().min(0).max(5).optional(),
  /** Minimum hourly price filter */
  minPrice: z.coerce.number().min(0).optional(),
  /** Maximum hourly price filter */
  maxPrice: z.coerce.number().min(0).optional(),
  /** Only show identity-verified workers */
  isVerified: z.coerce.boolean().optional(),
  /** Sorting preference */
  sortBy: z
    .enum(["recommended", "distance", "rating", "price_low", "price_high", "reviews"])
    .default("recommended"),
  /** Page number for pagination (1-indexed) */
  page: z.coerce.number().int().min(1).default(1),
  /** Number of results per page */
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// ── 4. Worker Summary Schema (Search Result Card) ─────────────────────────────

/**
 * Validates the worker profile summary payload rendered by search-result cards
 * (e.g. WorkerCard, SearchResultItem, MapWorkerPreview).
 */
export const workerSummarySchema = z
  .object({
    /** Unique identifier of the worker or worker profile */
    id: idSchema,
    /** Optional associated user account ID */
    userId: z.string().optional(),
    /** Display name of the skilled professional */
    name: z.string().min(1, "Worker name is required"),
    /** Full name alias */
    fullName: z.string().nullish(),
    /** Profile avatar image URL */
    avatarUrl: z.string().nullish(),
    /** Image URL alias for Next.js Image compatibility */
    image: z.string().nullish(),
    /** Short professional headline / tagline (e.g. "Licensed Master Electrician") */
    headline: z.string().nullish(),
    /** Primary service category */
    category: z.string().min(1, "Worker category is required"),
    /** Skill tags displayed on the card */
    skills: z.array(z.string()).default([]),
    /** Average review rating (0.0 to 5.0) */
    rating: z.coerce.number().min(0).max(5).default(0),
    /** Total count of client reviews */
    reviewCount: z.coerce.number().int().nonnegative().default(0),
    /** Base hourly rate in the specified currency */
    hourlyRate: z.coerce.number().nonnegative().default(0),
    /** Starting price for fixed-quote jobs */
    startingPrice: z.coerce.number().nonnegative().optional(),
    /** ISO currency code */
    currency: currencyCodeSchema.default("USD"),
    /** Distance in kilometers from the search origin if origin was provided */
    distanceKm: z.coerce.number().nonnegative().nullish(),
    /** Distance alias */
    distance: z.coerce.number().nonnegative().nullish(),
    /** Human-readable location or neighborhood label */
    location: z.string().nullish(),
    /** Identity verification badge status */
    isVerified: z.boolean().default(false),
    /** Current real-time availability status */
    availability: z
      .enum(["available_now", "today", "schedule_only", "busy", "offline"])
      .default("available_now"),
    /** Boolean convenience flag indicating immediate availability */
    isAvailable: z.boolean().default(true),
    /** Total number of successfully completed jobs */
    completedJobsCount: z.coerce.number().int().nonnegative().default(0),
    /** Average response time in minutes */
    responseTimeMinutes: z.coerce.number().int().nonnegative().nullish(),
    /** Whether this worker is featured or highlighted */
    featured: z.boolean().optional().default(false),
  })
  .passthrough();

export type WorkerSummary = z.infer<typeof workerSummarySchema>;

// ── 5. Search Results / Response Schema ───────────────────────────────────────

/**
 * Schema validating the response array of worker summaries returned from
 * the worker discovery endpoint (/workers/search).
 */
export const searchResultsSchema = z.array(workerSummarySchema);

export type SearchResults = z.infer<typeof searchResultsSchema>;

/**
 * Optional paginated envelope schema when search results include pagination metadata.
 */
export const paginatedSearchResultsSchema = z.object({
  items: searchResultsSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  filters: searchFiltersSchema.optional(),
});

export type PaginatedSearchResults = z.infer<typeof paginatedSearchResultsSchema>;
