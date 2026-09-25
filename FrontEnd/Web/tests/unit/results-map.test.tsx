import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultsMap } from "@/features/discovery/components/ResultsMap";
import { type WorkerSummary } from "@/features/discovery/schema";

describe("ResultsMap Component (src/features/discovery/components/ResultsMap.tsx)", () => {
  const mockWorkers: WorkerSummary[] = [
    {
      id: "wkr_map_1",
      name: "Tadesse Plumber",
      category: "plumbing",
      rating: 4.8,
      reviewCount: 30,
      hourlyRate: 55,
      currency: "USD",
      isVerified: true,
      skills: ["Leak Repair"],
      availability: "available_now",
      isAvailable: true,
      completedJobsCount: 88,
    },
    {
      id: "wkr_map_2",
      name: "Helen Electrician",
      category: "electrical",
      rating: 4.9,
      reviewCount: 18,
      hourlyRate: 70,
      currency: "USD",
      isVerified: true,
      skills: ["Lighting"],
      availability: "today",
      isAvailable: true,
      completedJobsCount: 45,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders map container, HUD badges, and search origin", () => {
    render(
      <ResultsMap
        workers={mockWorkers}
        center={{ latitude: 9.03, longitude: 38.74, address: "Bole, Addis Ababa" }}
        radiusKm={25}
      />
    );

    expect(screen.getByTestId("results-map-container")).toBeInTheDocument();
    expect(screen.getByText("Bole")).toBeInTheDocument();
    expect(screen.getByText("2 workers in 25km radius")).toBeInTheDocument();
  });

  it("renders interactive pin markers for all workers with prices", () => {
    render(<ResultsMap workers={mockWorkers} />);

    expect(screen.getByTestId("map-pin-wkr_map_1")).toBeInTheDocument();
    expect(screen.getByText("$55")).toBeInTheDocument();

    expect(screen.getByTestId("map-pin-wkr_map_2")).toBeInTheDocument();
    expect(screen.getByText("$70")).toBeInTheDocument();
  });

  it("opens worker preview card and triggers onSelectWorker on pin click", () => {
    const selectMock = jest.fn();

    render(<ResultsMap workers={mockWorkers} onSelectWorker={selectMock} />);

    // Initially no preview card
    expect(screen.queryByTestId("selected-worker-preview")).not.toBeInTheDocument();

    // Click pin for first worker
    const pin = screen.getByTestId("map-pin-wkr_map_1");
    fireEvent.click(pin);

    // Verify preview card is displayed with worker info
    expect(screen.getByTestId("selected-worker-preview")).toBeInTheDocument();
    expect(screen.getByText("Tadesse Plumber")).toBeInTheDocument();
    expect(screen.getByText("$55/hr")).toBeInTheDocument();
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledWith(mockWorkers[0]);

    // Close preview card
    const closeBtn = screen.getByRole("button", { name: /close preview/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("selected-worker-preview")).not.toBeInTheDocument();
  });

  it("renders preview card when selectedWorkerId is controlled", () => {
    render(<ResultsMap workers={mockWorkers} selectedWorkerId="wkr_map_2" />);

    expect(screen.getByTestId("selected-worker-preview")).toBeInTheDocument();
    expect(screen.getByText("Helen Electrician")).toBeInTheDocument();
    expect(screen.getByText("$70/hr")).toBeInTheDocument();
  });

  it("renders HUD zoom controls and handles click events", () => {
    render(<ResultsMap workers={mockWorkers} />);

    const zoomInBtn = screen.getByRole("button", { name: /zoom in/i });
    const zoomOutBtn = screen.getByRole("button", { name: /zoom out/i });
    const recenterBtn = screen.getByRole("button", { name: /recenter map/i });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    expect(recenterBtn).toBeInTheDocument();

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(recenterBtn);
  });

  it("renders 'Search as I move the map' checkbox and allows toggling", () => {
    render(<ResultsMap workers={mockWorkers} />);

    const checkbox = screen.getByLabelText(/search as i move the map/i) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it("renders empty state overlay when no workers are provided", () => {
    render(<ResultsMap workers={[]} />);

    expect(screen.getByText("No Workers in this Area")).toBeInTheDocument();
    expect(screen.getByText("0 workers in 25km radius")).toBeInTheDocument();
  });

  it("displays loading badge when isLoading is true", () => {
    render(<ResultsMap workers={mockWorkers} isLoading={true} />);

    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });
});
