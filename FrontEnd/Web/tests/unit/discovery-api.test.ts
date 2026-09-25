import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { searchWorkers, buildSearchQueryParams } from "@/features/discovery/api";
import { apiClient } from "@/lib/api-client";
import { type SearchFilters } from "@/features/discovery/schema";

describe("Discovery Feature API Client (src/features/discovery/api.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildSearchQueryParams", () => {
    it("builds query params dictionary with default values when empty filters passed", () => {
      const params = buildSearchQueryParams({});

      expect(params.radius).toBe(25);
      expect(params.radiusKm).toBe(25);
      expect(params.sortBy).toBe("recommended");
      expect(params.page).toBe(1);
      expect(params.pageSize).toBe(20);
      expect(params.limit).toBe(20);
      expect(params.availability).toBeUndefined(); // 'any' is omitted
      expect(params.category).toBeUndefined();
    });

    it("serializes complete search filters into query params with aliases", () => {
      const filters: SearchFilters = {
        category: "electrical",
        origin: {
          latitude: 9.03,
          longitude: 38.74,
          address: "Bole Road",
          city: "Addis Ababa",
        },
        radius: 30,
        availability: "available_now",
        query: "solar",
        minRating: 4.5,
        minPrice: 50,
        maxPrice: 150,
        isVerified: true,
        sortBy: "rating",
        page: 2,
        pageSize: 15,
      };

      const params = buildSearchQueryParams(filters);

      expect(params.category).toBe("electrical");
      expect(params.latitude).toBe(9.03);
      expect(params.longitude).toBe(38.74);
      expect(params.lat).toBe(9.03);
      expect(params.lng).toBe(38.74);
      expect(params.address).toBe("Bole Road");
      expect(params.city).toBe("Addis Ababa");
      expect(params.radius).toBe(30);
      expect(params.radiusKm).toBe(30);
      expect(params.availability).toBe("available_now");
      expect(params.query).toBe("solar");
      expect(params.q).toBe("solar");
      expect(params.minRating).toBe(4.5);
      expect(params.minPrice).toBe(50);
      expect(params.maxPrice).toBe(150);
      expect(params.isVerified).toBe(true);
      expect(params.sortBy).toBe("rating");
      expect(params.page).toBe(2);
      expect(params.pageSize).toBe(15);
      expect(params.limit).toBe(15);
    });
  });

  describe("searchWorkers", () => {
    it("calls /workers/search with query params and validates response array", async () => {
      const mockWorkersResponse = [
        {
          id: "wkr_1",
          name: "Solomon Electrician",
          category: "electrical",
          rating: 4.9,
          reviewCount: 38,
          hourlyRate: 60,
          currency: "USD",
          isVerified: true,
          skills: ["Wiring", "Generators"],
        },
        {
          id: "wkr_2",
          name: "Tigist Plumber",
          category: "plumbing",
          rating: 4.7,
          reviewCount: 15,
          hourlyRate: 45,
          currency: "USD",
          isVerified: false,
          skills: ["Pipe Repair", "Drains"],
        },
      ];

      const getSpy = jest
        .spyOn(apiClient, "get")
        .mockResolvedValueOnce(mockWorkersResponse);

      const results = await searchWorkers({
        category: "electrical",
        radius: 20,
      });

      expect(getSpy).toHaveBeenCalledTimes(1);
      const [path, options] = getSpy.mock.calls[0];
      expect(path).toBe("/workers/search");
      expect(options?.params).toMatchObject({
        category: "electrical",
        radius: 20,
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("wkr_1");
      expect(results[0].name).toBe("Solomon Electrician");
      expect(results[0].rating).toBe(4.9);
      expect(results[0].skills).toEqual(["Wiring", "Generators"]);
      expect(results[1].id).toBe("wkr_2");
      expect(results[1].name).toBe("Tigist Plumber");
    });

    it("correctly unwraps response array when enclosed in items envelope", async () => {
      const mockEnvelope = {
        items: [
          {
            id: "wkr_envelope_1",
            name: "Kassahun Carpenter",
            category: "carpentry",
          },
        ],
        total: 1,
      };

      jest.spyOn(apiClient, "get").mockResolvedValueOnce(mockEnvelope);

      const results = await searchWorkers({ category: "carpentry" });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("wkr_envelope_1");
      expect(results[0].name).toBe("Kassahun Carpenter");
      expect(results[0].category).toBe("carpentry");
      expect(results[0].rating).toBe(0); // defaulted
    });

    it("correctly unwraps response array when enclosed in data envelope", async () => {
      const mockDataEnvelope = {
        data: [
          {
            id: "wkr_data_1",
            name: "Hanna Painter",
            category: "painting",
          },
        ],
      };

      jest.spyOn(apiClient, "get").mockResolvedValueOnce(mockDataEnvelope);

      const results = await searchWorkers({ category: "painting" });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("wkr_data_1");
      expect(results[0].name).toBe("Hanna Painter");
    });

    it("passes through custom RequestOptions like signal and headers", async () => {
      const getSpy = jest.spyOn(apiClient, "get").mockResolvedValueOnce([]);

      const abortController = new AbortController();
      await searchWorkers(
        { category: "plumbing" },
        {
          signal: abortController.signal,
          timeout: 15000,
          headers: { "X-Custom-Client": "SkillConnect-Web" },
        }
      );

      const [, options] = getSpy.mock.calls[0];
      expect(options?.signal).toBe(abortController.signal);
      expect(options?.timeout).toBe(15000);
      expect(options?.headers).toMatchObject({
        "X-Custom-Client": "SkillConnect-Web",
      });
    });

    it("throws ZodError if response array contains invalid worker data", async () => {
      const invalidResponse = [
        {
          // Missing required id and category
          name: "Invalid Worker",
        },
      ];

      jest.spyOn(apiClient, "get").mockResolvedValueOnce(invalidResponse);

      await expect(searchWorkers()).rejects.toThrow();
    });
  });
});
