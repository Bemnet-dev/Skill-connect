import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkerCard } from "@/features/discovery/components/WorkerCard";
import { type WorkerSummary } from "@/features/discovery/schema";

describe("WorkerCard Component (src/features/discovery/components/WorkerCard.tsx)", () => {
  const baseWorker: WorkerSummary = {
    id: "wkr_test_101",
    name: "Dawit Haile",
    headline: "Licensed Master Electrician",
    category: "electrical",
    skills: ["Circuit Breakers", "Wiring", "Solar Panels", "Lighting"],
    rating: 4.9,
    reviewCount: 42,
    hourlyRate: 75,
    currency: "USD",
    distanceKm: 3.4,
    location: "Bole, Addis Ababa",
    isVerified: true,
    availability: "available_now",
    isAvailable: true,
    completedJobsCount: 120,
    avatarUrl: "https://example.com/dawit.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders worker name, headline, category, and hourly rate", () => {
    render(<WorkerCard worker={baseWorker} />);

    expect(screen.getByText("Dawit Haile")).toBeInTheDocument();
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    expect(screen.getByText("Licensed Master Electrician")).toBeInTheDocument();
    expect(screen.getByText("$75/hr")).toBeInTheDocument();
  });

  it("renders star rating and total review count", () => {
    render(<WorkerCard worker={baseWorker} />);

    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("(42)")).toBeInTheDocument();
  });

  it("renders 'New' when worker has 0 reviews/rating", () => {
    const unratedWorker: WorkerSummary = {
      ...baseWorker,
      rating: 0,
      reviewCount: 0,
    };

    render(<WorkerCard worker={unratedWorker} />);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders distance and location string", () => {
    render(<WorkerCard worker={baseWorker} />);

    expect(screen.getByText("3.4 km away")).toBeInTheDocument();
    expect(screen.getByText("Bole, Addis Ababa")).toBeInTheDocument();
  });

  it("renders availability badge with status dot", () => {
    const { rerender } = render(<WorkerCard worker={baseWorker} />);
    expect(screen.getAllByText("Available Now").length).toBeGreaterThan(0);

    // Test "today" availability
    rerender(<WorkerCard worker={{ ...baseWorker, availability: "today" }} />);
    expect(screen.getAllByText("Available Today").length).toBeGreaterThan(0);

    // Test "schedule_only" availability
    rerender(<WorkerCard worker={{ ...baseWorker, availability: "schedule_only" }} />);
    expect(screen.getAllByText("Schedule Only").length).toBeGreaterThan(0);

    // Test "offline" availability
    rerender(<WorkerCard worker={{ ...baseWorker, availability: "offline", isAvailable: false }} />);
    expect(screen.getAllByText("Offline").length).toBeGreaterThan(0);
  });

  it("renders verification-tier badge for verified worker", () => {
    render(<WorkerCard worker={baseWorker} />);

    expect(screen.getByText("Verified Pro")).toBeInTheDocument();
  });

  it("renders custom verification tier when present in worker payload", () => {
    const tieredWorker: WorkerSummary = {
      ...baseWorker,
      tier: "Top Rated 2026",
    };

    render(<WorkerCard worker={tieredWorker} />);

    expect(screen.getByText("Top Rated 2026")).toBeInTheDocument();
  });

  it("does not render verification badge when worker is unverified", () => {
    const unverifiedWorker: WorkerSummary = {
      ...baseWorker,
      isVerified: false,
    };

    render(<WorkerCard worker={unverifiedWorker} />);

    expect(screen.queryByText("Verified Pro")).not.toBeInTheDocument();
  });

  it("renders skill badges and '+N more' indicator", () => {
    render(<WorkerCard worker={baseWorker} />);

    expect(screen.getByText("Circuit Breakers")).toBeInTheDocument();
    expect(screen.getByText("Wiring")).toBeInTheDocument();
    expect(screen.getByText("Solar Panels")).toBeInTheDocument();
    // 4th skill should be folded into '+1 more'
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  it("renders initials fallback when avatar image is missing", () => {
    const noAvatarWorker: WorkerSummary = {
      ...baseWorker,
      avatarUrl: undefined,
      image: undefined,
    };

    render(<WorkerCard worker={noAvatarWorker} />);

    expect(screen.getByText("DH")).toBeInTheDocument();
  });

  it("handles onToggleBookmark callback when bookmark button is clicked", () => {
    const toggleBookmarkMock = jest.fn();

    render(
      <WorkerCard
        worker={baseWorker}
        onToggleBookmark={toggleBookmarkMock}
        isBookmarked={false}
      />
    );

    const bookmarkBtn = screen.getByRole("button", { name: /save worker/i });
    fireEvent.click(bookmarkBtn);

    expect(toggleBookmarkMock).toHaveBeenCalledTimes(1);
    expect(toggleBookmarkMock).toHaveBeenCalledWith("wkr_test_101");
  });

  it("handles onBook callback when primary action button is clicked", () => {
    const bookMock = jest.fn();

    render(<WorkerCard worker={baseWorker} onBook={bookMock} />);

    const bookBtn = screen.getByRole("button", { name: /view profile/i });
    fireEvent.click(bookBtn);

    expect(bookMock).toHaveBeenCalledTimes(1);
    expect(bookMock).toHaveBeenCalledWith(baseWorker);
  });

  it("handles onClick callback when card container is selected", () => {
    const clickMock = jest.fn();

    render(<WorkerCard worker={baseWorker} onClick={clickMock} />);

    const card = screen.getByTestId("worker-card-wkr_test_101");
    fireEvent.click(card);

    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledWith(baseWorker);
  });
});
