import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  ErrorBoundary,
  withErrorBoundary,
  EmptyState,
  ToastItem,
  ToastContainer,
  JobCardSkeleton,
  WorkerCardSkeleton,
  BookingCardSkeleton,
  TableSkeleton,
  DetailSkeleton,
  MetricCardSkeleton,
  ListSkeleton,
} from "@/components/feedback";
import { useUiStore, toast, Toast } from "@/state/store/uiStore";
import { Briefcase } from "lucide-react";

// Problematic component for testing ErrorBoundary
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Simulated component error");
  }
  return <div data-testid="child-content">Normal Component Content</div>;
}

describe("Feedback Components (src/components/feedback/*)", () => {
  beforeEach(() => {
    useUiStore.getState().resetUi();
    // Silence React's console.error during expected ErrorBoundary tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("ErrorBoundary Component", () => {
    it("renders children when no error is thrown", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders fallback UI when an unhandled error is thrown in child", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /go to homepage/i })).toBeInTheDocument();
    });

    it("triggers onError callback when an error is caught", () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Simulated component error" }),
        expect.any(Object)
      );
    });

    it("resets state and triggers onReset when 'Try Again' is clicked", () => {
      const onResetMock = jest.fn();

      const { rerender } = render(
        <ErrorBoundary onReset={onResetMock}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Now fix the child to not throw and click reset
      rerender(
        <ErrorBoundary onReset={onResetMock}>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(onResetMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("supports custom fallback render prop function", () => {
      render(
        <ErrorBoundary
          fallback={({ error, resetErrorBoundary }) => (
            <div data-testid="custom-fallback">
              <p>{error.message}</p>
              <button type="button" onClick={resetErrorBoundary}>
                Custom Reset
              </button>
            </div>
          )}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Simulated component error")).toBeInTheDocument();
    });

    it("withErrorBoundary HOC wraps components properly", () => {
      const SafeComponent = withErrorBoundary(ThrowingComponent);

      render(<SafeComponent shouldThrow={false} />);
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  describe("EmptyState Component", () => {
    it("renders title, description, and custom icon", () => {
      render(
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try broadening your search keywords or adjusting filters."
        />
      );

      expect(screen.getByText("No jobs found")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Try broadening your search keywords or adjusting filters."
        )
      ).toBeInTheDocument();
    });

    it("renders primary action button and fires onClick handler", () => {
      const handleAction = jest.fn();

      render(
        <EmptyState
          title="No applications"
          action={{
            label: "Explore Jobs",
            onClick: handleAction,
          }}
        />
      );

      const actionBtn = screen.getByRole("button", { name: /explore jobs/i });
      expect(actionBtn).toBeInTheDocument();

      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("renders secondary action button", () => {
      const handleSecondary = jest.fn();

      render(
        <EmptyState
          title="No bookings"
          action={{ label: "Book Now" }}
          secondaryAction={{
            label: "View History",
            onClick: handleSecondary,
          }}
        />
      );

      const secondaryBtn = screen.getByRole("button", { name: /view history/i });
      expect(secondaryBtn).toBeInTheDocument();

      fireEvent.click(secondaryBtn);
      expect(handleSecondary).toHaveBeenCalledTimes(1);
    });

    it("renders custom children and supports bordered option", () => {
      render(
        <EmptyState title="Filtered empty" bordered>
          <div data-testid="custom-child">Try suggestion: Plumbers</div>
        </EmptyState>
      );

      expect(screen.getByTestId("custom-child")).toBeInTheDocument();
    });
  });

  describe("Toast & ToastContainer Components", () => {
    it("renders nothing when there are no active toasts", () => {
      const { container } = render(<ToastContainer />);
      expect(container.firstChild).toBeNull();
    });

    it("renders active toasts from uiStore with title, message, and icon", () => {
      render(<ToastContainer />);

      act(() => {
        toast.success("Job applied successfully!", { title: "Success" });
      });

      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Job applied successfully!")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders error toasts with alert role and dismisses on close button click", () => {
      render(<ToastContainer />);

      act(() => {
        toast.error("Failed to load conversation", { title: "Network Error" });
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Network Error")).toBeInTheDocument();

      const closeBtn = screen.getByLabelText(/dismiss notification/i);
      fireEvent.click(closeBtn);

      expect(screen.queryByText("Network Error")).not.toBeInTheDocument();
    });

    it("renders action button and triggers callback on click", () => {
      const actionMock = jest.fn();

      render(<ToastContainer />);

      act(() => {
        toast.info("Booking confirmed", {
          action: {
            label: "View Booking",
            onClick: actionMock,
          },
        });
      });

      const actionBtn = screen.getByRole("button", { name: /view booking/i });
      expect(actionBtn).toBeInTheDocument();

      fireEvent.click(actionBtn);
      expect(actionMock).toHaveBeenCalledTimes(1);
      // Clicking the action also dismisses the toast
      expect(screen.queryByText("Booking confirmed")).not.toBeInTheDocument();
    });

    it("renders standalone ToastItem directly", () => {
      const mockDismiss = jest.fn();
      const mockToast: Toast = {
        id: "test-1",
        type: "warning",
        title: "Warning Notice",
        message: "Your subscription expires in 3 days",
        duration: 0,
        dismissible: true,
        createdAt: Date.now(),
      };

      render(<ToastItem toast={mockToast} onDismiss={mockDismiss} />);

      expect(screen.getByText("Warning Notice")).toBeInTheDocument();
      expect(
        screen.getByText("Your subscription expires in 3 days")
      ).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText(/dismiss notification/i);
      fireEvent.click(dismissBtn);
      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    it("does not render dismiss button when dismissible is false", () => {
      const mockToast: Toast = {
        id: "test-undismissible",
        type: "info",
        message: "Persistent system maintenance in progress",
        dismissible: false,
        createdAt: Date.now(),
      };

      render(<ToastItem toast={mockToast} onDismiss={jest.fn()} />);

      expect(
        screen.queryByLabelText(/dismiss notification/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Skeleton Feedback Components", () => {
    it("renders JobCardSkeleton with aria-hidden", () => {
      const { container } = render(<JobCardSkeleton />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders WorkerCardSkeleton with aria-hidden", () => {
      const { container } = render(<WorkerCardSkeleton />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders BookingCardSkeleton with aria-hidden", () => {
      const { container } = render(<BookingCardSkeleton />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders TableSkeleton with specified rows and columns", () => {
      const { container } = render(<TableSkeleton columns={4} rows={3} />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders DetailSkeleton with aria-hidden", () => {
      const { container } = render(<DetailSkeleton />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders MetricCardSkeleton with aria-hidden", () => {
      const { container } = render(<MetricCardSkeleton />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("renders ListSkeleton with specified count", () => {
      const { container } = render(<ListSkeleton count={4} />);
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });
  });
});
