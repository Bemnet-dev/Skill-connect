/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Feedback Components Barrel Export
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for global error boundaries, empty states, toasts,
 * and loading skeletons used across customer, worker, and admin interfaces.
 */

export {
  ErrorBoundary,
  DefaultErrorFallback,
  withErrorBoundary,
  type ErrorBoundaryProps,
  type FallbackProps,
} from "./ErrorBoundary";

export {
  EmptyState,
  type EmptyStateProps,
  type EmptyStateAction,
} from "./EmptyState";

export {
  ToastItem,
  ToastContainer,
  toast,
  type ToastItemProps,
  type ToastContainerProps,
} from "./Toast";

export {
  JobCardSkeleton,
  WorkerCardSkeleton,
  BookingCardSkeleton,
  TableSkeleton,
  DetailSkeleton,
  MetricCardSkeleton,
  ListSkeleton,
  type TableSkeletonProps,
  type ListSkeletonProps,
} from "./SkeletonComponents";
