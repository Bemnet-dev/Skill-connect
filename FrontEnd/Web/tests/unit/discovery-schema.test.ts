import { describe, it, expect } from "@jest/globals";
import {
  searchFiltersSchema,
  workerSummarySchema,
  searchResultsSchema,
  paginatedSearchResultsSchema,
  searchOriginSchema,
  searchAvailabilitySchema,
  portfolioItemSchema,
  type SearchFilters,
  type WorkerSummary,
  type SearchResults,
  type PortfolioItem,
} from "@/features/discovery/schema";

describe("Discovery Feature Schemas (src/features/discovery/schema.ts)", () => {
  describe("searchOriginSchema", () => {
    it("validates correct geographic coordinates", () => {
      const valid = {
        latitude: 9.03,
        longitude: 38.74,
        address: "Bole, Addis Ababa",
        city: "Addis Ababa",
      };
      const parsed = searchOriginSchema.parse(valid);
      expect(parsed.latitude).toBe(9.03);
      expect(parsed.longitude).toBe(38.74);
      expect(parsed.address).toBe("Bole, Addis Ababa");
    });

    it("coerces coordinate strings from query params", () => {
      const parsed = searchOriginSchema.parse({
        latitude: "9.03",
        longitude: "38.74",
      });
      expect(parsed.latitude).toBe(9.03);
      expect(parsed.longitude).toBe(38.74);
    });

    it("rejects invalid latitude out of range [-90, 90]", () => {
      expect(() =>
        searchOriginSchema.parse({ latitude: 95, longitude: 38.74 })
      ).toThrow();
      expect(() =>
        searchOriginSchema.parse({ latitude: -91, longitude: 38.74 })
      ).toThrow();
    });

    it("rejects invalid longitude out of range [-180, 180]", () => {
      expect(() =>
        searchOriginSchema.parse({ latitude: 9.03, longitude: 185 })
      ).toThrow();
      expect(() =>
        searchOriginSchema.parse({ latitude: 9.03, longitude: -185 })
      ).toThrow();
    });
  });

  describe("searchFiltersSchema", () => {
    it("accepts empty filters object and assigns defaults", () => {
      const parsed = searchFiltersSchema.parse({});
      expect(parsed.radius).toBe(25);
      expect(parsed.availability).toBe("any");
      expect(parsed.sortBy).toBe("recommended");
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(20);
    });

    it("validates comprehensive search filters (category, origin, radius, availability)", () => {
      const filters: SearchFilters = {
        category: "plumbing",
        origin: {
          latitude: 9.01,
          longitude: 38.76,
          city: "Addis Ababa",
        },
        radius: 15,
        availability: "available_now",
        query: "pipe leak",
        minRating: 4.0,
        minPrice: 50,
        maxPrice: 200,
        isVerified: true,
        sortBy: "rating",
        page: 2,
        pageSize: 10,
      };

      const parsed = searchFiltersSchema.parse(filters);
      expect(parsed.category).toBe("plumbing");
      expect(parsed.origin?.latitude).toBe(9.01);
      expect(parsed.origin?.longitude).toBe(38.76);
      expect(parsed.radius).toBe(15);
      expect(parsed.availability).toBe("available_now");
      expect(parsed.query).toBe("pipe leak");
      expect(parsed.minRating).toBe(4.0);
      expect(parsed.isVerified).toBe(true);
      expect(parsed.sortBy).toBe("rating");
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(10);
    });

    it("coerces URLSearchParams string values cleanly", () => {
      const parsed = searchFiltersSchema.parse({
        radius: "50",
        minRating: "4.5",
        page: "3",
        pageSize: "15",
        isVerified: "true",
      });

      expect(parsed.radius).toBe(50);
      expect(parsed.minRating).toBe(4.5);
      expect(parsed.page).toBe(3);
      expect(parsed.pageSize).toBe(15);
      expect(parsed.isVerified).toBe(true);
    });

    it("validates all availability enum values", () => {
      for (const val of ["any", "available_now", "today", "this_week"] as const) {
        expect(searchAvailabilitySchema.parse(val)).toBe(val);
        expect(searchFiltersSchema.parse({ availability: val }).availability).toBe(val);
      }
    });

    it("rejects invalid availability value", () => {
      expect(() =>
        searchFiltersSchema.parse({ availability: "next_month" })
      ).toThrow();
    });

    it("rejects non-positive radius or radius exceeding maximum limit", () => {
      expect(() => searchFiltersSchema.parse({ radius: 0 })).toThrow();
      expect(() => searchFiltersSchema.parse({ radius: -5 })).toThrow();
      expect(() => searchFiltersSchema.parse({ radius: 501 })).toThrow();
    });
  });

  describe("portfolioItemSchema", () => {
    it("validates an object portfolio item with details and image", () => {
      const item: PortfolioItem = {
        id: "port_1",
        title: "200A Electrical Panel Upgrade",
        description: "Replaced outdated fuse box with modern breaker panel",
        imageUrl: "https://example.com/panel.jpg",
        image: "https://example.com/panel.jpg",
        url: "https://example.com/project/panel",
        category: "electrical",
        completedAt: "2026-08-15",
      };

      const parsed = portfolioItemSchema.parse(item);
      expect(parsed.id).toBe("port_1");
      expect(parsed.title).toBe("200A Electrical Panel Upgrade");
      expect(parsed.description).toBe("Replaced outdated fuse box with modern breaker panel");
      expect(parsed.imageUrl).toBe("https://example.com/panel.jpg");
      expect(parsed.category).toBe("electrical");
    });

    it("pre-processes a raw media URL string into a portfolio item object", () => {
      const parsed = portfolioItemSchema.parse("https://example.com/work-photo.png");
      expect(parsed.imageUrl).toBe("https://example.com/work-photo.png");
    });
  });

  describe("workerSummarySchema (Search Result Card)", () => {
    it("validates a full worker summary payload with all card attributes", () => {
      const fullWorker: WorkerSummary = {
        id: "wkr_101",
        userId: "usr_101",
        name: "Dawit Haile",
        fullName: "Dawit Haile",
        headline: "Master Electrician & Wiring Specialist",
        bio: "Certified master electrician with 12+ years of residential and commercial experience in Addis Ababa.",
        category: "electrical",
        skills: ["Commercial Wiring", "Circuit Breakers", "Solar Installations"],
        languages: ["English", "Amharic", "Oromo"],
        rating: 4.85,
        reviewCount: 94,
        hourlyRate: 75,
        startingPrice: 50,
        currency: "USD",
        distanceKm: 3.4,
        distance: 3.4,
        serviceRadiusKm: 30,
        location: "Bole Medhanealem",
        isVerified: true,
        availability: "available_now",
        isAvailable: true,
        completedJobsCount: 142,
        responseTimeMinutes: 15,
        avatarUrl: "https://example.com/avatar.jpg",
        image: "https://example.com/avatar.jpg",
        portfolio: [
          {
            id: "p_1",
            title: "Villa Solar Installation",
            imageUrl: "https://example.com/solar.jpg",
          },
          "https://example.com/generator-backup.jpg",
        ],
        featured: true,
      };

      const parsed = workerSummarySchema.parse(fullWorker);
      expect(parsed.id).toBe("wkr_101");
      expect(parsed.name).toBe("Dawit Haile");
      expect(parsed.headline).toBe("Master Electrician & Wiring Specialist");
      expect(parsed.bio).toBe(
        "Certified master electrician with 12+ years of residential and commercial experience in Addis Ababa."
      );
      expect(parsed.category).toBe("electrical");
      expect(parsed.skills).toHaveLength(3);
      expect(parsed.languages).toEqual(["English", "Amharic", "Oromo"]);
      expect(parsed.rating).toBe(4.85);
      expect(parsed.reviewCount).toBe(94);
      expect(parsed.hourlyRate).toBe(75);
      expect(parsed.distanceKm).toBe(3.4);
      expect(parsed.serviceRadiusKm).toBe(30);
      expect(parsed.isVerified).toBe(true);
      expect(parsed.availability).toBe("available_now");
      expect(parsed.isAvailable).toBe(true);
      expect(parsed.completedJobsCount).toBe(142);
      expect(parsed.responseTimeMinutes).toBe(15);
      expect(parsed.portfolio).toHaveLength(2);
      expect(parsed.portfolio[0].title).toBe("Villa Solar Installation");
      expect(parsed.portfolio[1].imageUrl).toBe("https://example.com/generator-backup.jpg");
      expect(parsed.featured).toBe(true);
    });

    it("applies defaults for minimal worker summary", () => {
      const minimal = {
        id: "wkr_min_1",
        name: "Almaz Kebede",
        category: "plumbing",
      };

      const parsed = workerSummarySchema.parse(minimal);
      expect(parsed.id).toBe("wkr_min_1");
      expect(parsed.name).toBe("Almaz Kebede");
      expect(parsed.category).toBe("plumbing");
      expect(parsed.bio).toBeUndefined();
      expect(parsed.serviceRadiusKm).toBeUndefined();
      expect(parsed.languages).toEqual([]);
      expect(parsed.portfolio).toEqual([]);
      expect(parsed.rating).toBe(0);
      expect(parsed.reviewCount).toBe(0);
      expect(parsed.skills).toEqual([]);
      expect(parsed.hourlyRate).toBe(0);
      expect(parsed.currency).toBe("USD");
      expect(parsed.isVerified).toBe(false);
      expect(parsed.isAvailable).toBe(true);
      expect(parsed.availability).toBe("available_now");
      expect(parsed.completedJobsCount).toBe(0);
      expect(parsed.featured).toBe(false);
    });

    it("rejects missing required fields (id, name, category)", () => {
      expect(() => workerSummarySchema.parse({ name: "Bob", category: "hvac" })).toThrow();
      expect(() => workerSummarySchema.parse({ id: "w_1", category: "hvac" })).toThrow();
      expect(() => workerSummarySchema.parse({ id: "w_1", name: "Bob" })).toThrow();
    });

    it("rejects invalid rating out of bounds [0, 5]", () => {
      expect(() =>
        workerSummarySchema.parse({
          id: "w_1",
          name: "Bob",
          category: "plumbing",
          rating: -1,
        })
      ).toThrow();

      expect(() =>
        workerSummarySchema.parse({
          id: "w_1",
          name: "Bob",
          category: "plumbing",
          rating: 5.5,
        })
      ).toThrow();
    });

    it("allows passthrough of additional custom backend metadata", () => {
      const extra = {
        id: "wkr_extra_1",
        name: "Sara Plumber",
        category: "plumbing",
        customBadge: "Top Rated 2026",
        tier: "platinum",
      };

      const parsed = workerSummarySchema.parse(extra) as Record<string, unknown>;
      expect(parsed.customBadge).toBe("Top Rated 2026");
      expect(parsed.tier).toBe("platinum");
    });
  });

  describe("searchResultsSchema", () => {
    it("validates an array of worker summaries returned by /workers/search", () => {
      const response: SearchResults = [
        {
          id: "wkr_1",
          name: "John Plumber",
          category: "plumbing",
        },
        {
          id: "wkr_2",
          name: "Mary Electrician",
          category: "electrical",
        },
      ];

      const parsed = searchResultsSchema.parse(response);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe("wkr_1");
      expect(parsed[1].name).toBe("Mary Electrician");
    });
  });

  describe("paginatedSearchResultsSchema", () => {
    it("validates a paginated search response envelope", () => {
      const envelope = {
        items: [
          {
            id: "wkr_1",
            name: "John Plumber",
            category: "plumbing",
          },
        ],
        total: 45,
        page: 1,
        pageSize: 20,
        totalPages: 3,
        hasMore: true,
        filters: {
          category: "plumbing",
          radius: 25,
        },
      };

      const parsed = paginatedSearchResultsSchema.parse(envelope);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.total).toBe(45);
      expect(parsed.totalPages).toBe(3);
    });
  });
});
