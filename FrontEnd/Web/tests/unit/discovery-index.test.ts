import { describe, it, expect } from "@jest/globals";
import {
  // Schemas
  searchFiltersSchema,
  workerSummarySchema,
  searchResultsSchema,
  paginatedSearchResultsSchema,
  searchOriginSchema,
  searchAvailabilitySchema,
  portfolioItemSchema,
  // API Functions
  searchWorkers,
  buildSearchQueryParams,
  // Hooks
  useSearchWorkers,
  // Components
  WorkerCard,
  ResultsMap,
  // Types (compile-time validation)
  type SearchFilters,
  type WorkerSummary,
  type SearchResults,
  type PaginatedSearchResults,
  type SearchOrigin,
  type SearchAvailability,
  type PortfolioItem,
  type UseSearchWorkersOptions,
  type WorkerCardProps,
  type ResultsMapProps,
} from "@/features/discovery";

describe("Discovery Feature Barrel (src/features/discovery/index.ts)", () => {
  describe("Schema Exports", () => {
    it("exports all canonical discovery validation schemas", () => {
      expect(searchFiltersSchema).toBeDefined();
      expect(typeof searchFiltersSchema.parse).toBe("function");

      expect(workerSummarySchema).toBeDefined();
      expect(typeof workerSummarySchema.parse).toBe("function");

      expect(searchResultsSchema).toBeDefined();
      expect(typeof searchResultsSchema.parse).toBe("function");

      expect(paginatedSearchResultsSchema).toBeDefined();
      expect(typeof paginatedSearchResultsSchema.parse).toBe("function");

      expect(searchOriginSchema).toBeDefined();
      expect(typeof searchOriginSchema.parse).toBe("function");

      expect(searchAvailabilitySchema).toBeDefined();
      expect(typeof searchAvailabilitySchema.parse).toBe("function");

      expect(portfolioItemSchema).toBeDefined();
      expect(typeof portfolioItemSchema.parse).toBe("function");
    });

    it("correctly parses inputs through schemas imported from barrel", () => {
      const filters = searchFiltersSchema.parse({ category: "plumbing", radius: 15 });
      expect(filters.category).toBe("plumbing");
      expect(filters.radius).toBe(15);

      const worker = workerSummarySchema.parse({
        id: "wkr_1",
        name: "Dawit",
        category: "electrical",
      });
      expect(worker.name).toBe("Dawit");
      expect(worker.rating).toBe(0);

      const results = searchResultsSchema.parse([worker]);
      expect(results).toHaveLength(1);
    });
  });

  describe("API Client Exports", () => {
    it("exports searchWorkers and buildSearchQueryParams as callable functions", () => {
      expect(typeof searchWorkers).toBe("function");
      expect(typeof buildSearchQueryParams).toBe("function");
    });
  });

  describe("Hook Exports", () => {
    it("exports useSearchWorkers as a hook function", () => {
      expect(typeof useSearchWorkers).toBe("function");
    });
  });

  describe("Component Exports", () => {
    it("exports WorkerCard and ResultsMap UI components", () => {
      expect(typeof WorkerCard).toBe("function");
      expect(typeof ResultsMap).toBe("function");
    });
  });

  describe("Type Definitions & Inferred Types", () => {
    it("provides compile-time types for discovery domain entities", () => {
      const origin: SearchOrigin = { latitude: 9.03, longitude: 38.74 };
      const availability: SearchAvailability = "available_now";
      const filters: SearchFilters = { category: "plumbing", origin, availability };
      const portfolioItem: PortfolioItem = {
        id: "port_1",
        title: "Kitchen Remodel",
        imageUrl: "https://example.com/pic.jpg",
      };
      const worker: WorkerSummary = {
        id: "wkr_type_1",
        name: "Test Worker",
        bio: "Experienced technician",
        category: "plumbing",
        skills: ["Pipes"],
        languages: ["English"],
        serviceRadiusKm: 25,
        rating: 4.8,
        reviewCount: 12,
        hourlyRate: 50,
        currency: "USD",
        isVerified: true,
        availability: "available_now",
        isAvailable: true,
        completedJobsCount: 20,
        portfolio: [portfolioItem],
      };
      const results: SearchResults = [worker];
      const paginated: PaginatedSearchResults = {
        items: results,
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasMore: false,
      };
      const hookOptions: UseSearchWorkersOptions = { enabled: true };
      const cardProps: WorkerCardProps = { worker };
      const mapProps: ResultsMapProps = { workers: results };

      expect(filters).toBeDefined();
      expect(portfolioItem).toBeDefined();
      expect(worker).toBeDefined();
      expect(results).toBeDefined();
      expect(paginated).toBeDefined();
      expect(hookOptions).toBeDefined();
      expect(cardProps).toBeDefined();
      expect(mapProps).toBeDefined();
    });
  });
});
