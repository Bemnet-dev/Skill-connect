import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createQueryClient } from "@/state/query/queryClient";
import { useSearchWorkers } from "@/features/discovery/hooks/useSearchWorkers";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/state/query/queryKeys";

function createTestWrapper(client?: QueryClient) {
  const queryClient = client ?? createQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientTestWrapper";
  return { Wrapper, queryClient };
}

describe("useSearchWorkers Hook (src/features/discovery/hooks/useSearchWorkers.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches worker search results and populates data", async () => {
    const mockWorkers = [
      {
        id: "wkr_plumber_1",
        name: "Abel Plumber",
        category: "plumbing",
        rating: 4.8,
        reviewCount: 22,
        hourlyRate: 50,
        currency: "USD",
        skills: ["Drain Cleaning", "Leak Repair"],
      },
    ];

    const getSpy = jest
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce(mockWorkers);

    const { Wrapper } = createTestWrapper();
    const filters = { category: "plumbing", radius: 25 };

    const { result } = renderHook(() => useSearchWorkers(filters), {
      wrapper: Wrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe("wkr_plumber_1");
    expect(result.current.data?.[0].name).toBe("Abel Plumber");
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it("includes the full filters object in the query key", async () => {
    const filters = {
      category: "electrical",
      radius: 50,
      availability: "available_now" as const,
      minRating: 4.0,
    };

    jest.spyOn(apiClient, "get").mockResolvedValueOnce([]);

    const { Wrapper, queryClient } = createTestWrapper();

    renderHook(() => useSearchWorkers(filters), {
      wrapper: Wrapper,
    });

    // Query key in cache must match queryKeys.discovery.search(filters)
    const expectedKey = queryKeys.discovery.search(filters);
    expect(expectedKey).toEqual(["discovery", "search", filters]);

    await waitFor(() => {
      const queryState = queryClient.getQueryState(expectedKey);
      expect(queryState).toBeDefined();
    });
  });

  it("caches distinct filter combinations separately in QueryClient cache", async () => {
    const plumbingWorkers = [
      { id: "p1", name: "Plumber One", category: "plumbing" },
    ];
    const electricalWorkers = [
      { id: "e1", name: "Electrician One", category: "electrical" },
    ];

    const getSpy = jest.spyOn(apiClient, "get");
    getSpy.mockImplementation((path, options) => {
      const category = (options?.params as Record<string, unknown>)?.category;
      if (category === "plumbing") return Promise.resolve(plumbingWorkers);
      if (category === "electrical") return Promise.resolve(electricalWorkers);
      return Promise.resolve([]);
    });

    const queryClient = createQueryClient();
    const { Wrapper } = createTestWrapper(queryClient);

    const filtersPlumbing = { category: "plumbing", radius: 10 };
    const filtersElectrical = { category: "electrical", radius: 10 };

    // 1. Fetch plumbing
    const { result: plumbingResult } = renderHook(
      () => useSearchWorkers(filtersPlumbing),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(plumbingResult.current.isSuccess).toBe(true);
    });
    expect(plumbingResult.current.data?.[0].name).toBe("Plumber One");

    // 2. Fetch electrical with separate filters
    const { result: electricalResult } = renderHook(
      () => useSearchWorkers(filtersElectrical),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(electricalResult.current.isSuccess).toBe(true);
    });
    expect(electricalResult.current.data?.[0].name).toBe("Electrician One");

    // 3. Verify both entries exist independently in QueryCache
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const plumbingQuery = queries.find(
      (q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.discovery.search(filtersPlumbing))
    );
    const electricalQuery = queries.find(
      (q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKeys.discovery.search(filtersElectrical))
    );

    expect(plumbingQuery).toBeDefined();
    expect(electricalQuery).toBeDefined();
    expect(plumbingQuery?.state.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Plumber One" })])
    );
    expect(electricalQuery?.state.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Electrician One" })])
    );
  });

  it("respects enabled: false option", async () => {
    const getSpy = jest.spyOn(apiClient, "get");

    const { Wrapper } = createTestWrapper();

    const { result } = renderHook(
      () => useSearchWorkers({ category: "carpentry" }, { enabled: false }),
      { wrapper: Wrapper }
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("handles search error state gracefully", async () => {
    jest.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

    const { Wrapper } = createTestWrapper();

    const { result } = renderHook(
      () => useSearchWorkers({ category: "painting" }, { retry: false }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Network Error");
  });
});
