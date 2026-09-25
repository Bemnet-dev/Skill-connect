

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * COORDINATION NOTE & DEVELOPER CONTRACT (SHARED FILE)
 * ─────────────────────────────────────────────────────────────────────────────
 * Every feature's cache key lives in this file.
 *
 * RULES FOR BOTH DEVELOPERS:
 * 1. NEVER hardcode query keys inline inside feature hooks (e.g. `queryKey: ['workers']`).
 * 2. ALWAYS import from this file: `import { queryKeys } from '@/state/query/queryKeys';`
 * 3. Follow the TanStack Query Key Factory Pattern:
 *    - `all`: The root scope for the entire domain entity (e.g. `queryKeys.workers.all`).
 *    - `lists()` / `list(filters)`: For collections, paginated queries, and filtered lists.
 *    - `details()` / `detail(id)`: For individual entity records and sub-resources.
 * 4. This pattern enables surgical cache invalidation:
 *    - Invalidate everything in a domain: `queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })`
 *    - Invalidate only lists: `queryClient.invalidateQueries({ queryKey: queryKeys.bookings.lists() })`
 *    - Invalidate a specific record: `queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })`
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface WorkerSearchFilters {
  q?: string;
  category?: string;
  city?: string;
  minRating?: number;
  maxHourlyRate?: number;
  availableNow?: boolean;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface BookingFilters {
  status?: string;
  role?: "customer" | "worker";
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface DisputeFilters {
  status?: string;
  resolved?: boolean;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export const queryKeys = {
  /**
   * 1. Authentication & Current User Session
   */
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
    permissions: () => [...queryKeys.auth.all, "permissions"] as const,
  },

  /**
   * 2. Discovery & Worker Search
   */
  discovery: {
    all: ["discovery"] as const,
    search: (filters?: WorkerSearchFilters) =>
      [...queryKeys.discovery.all, "search", filters] as const,
    popularCategories: () =>
      [...queryKeys.discovery.all, "popular-categories"] as const,
    featuredWorkers: () =>
      [...queryKeys.discovery.all, "featured-workers"] as const,
    nearbyWorkers: (coords?: { latitude: number; longitude: number; radiusKm?: number }) =>
      [...queryKeys.discovery.all, "nearby", coords] as const,
  },

  /**
   * 3. Worker Profiles & Portfolios
   */
  workers: {
    all: ["workers"] as const,
    lists: () => [...queryKeys.workers.all, "list"] as const,
    list: (filters?: WorkerSearchFilters) =>
      [...queryKeys.workers.lists(), filters] as const,
    details: () => [...queryKeys.workers.all, "detail"] as const,
    detail: (workerId: string) =>
      [...queryKeys.workers.details(), workerId] as const,
    availability: (workerId: string) =>
      [...queryKeys.workers.detail(workerId), "availability"] as const,
    portfolio: (workerId: string) =>
      [...queryKeys.workers.detail(workerId), "portfolio"] as const,
    reviews: (workerId: string, page = 1) =>
      [...queryKeys.workers.detail(workerId), "reviews", { page }] as const,
  },

  /**
   * 4. Bookings & Jobs Management
   */
  bookings: {
    all: ["bookings"] as const,
    lists: () => [...queryKeys.bookings.all, "list"] as const,
    list: (filters?: BookingFilters) =>
      [...queryKeys.bookings.lists(), filters] as const,
    customerList: (customerId?: string, filters?: BookingFilters) =>
      [...queryKeys.bookings.lists(), "customer", customerId, filters] as const,
    workerList: (workerId?: string, filters?: BookingFilters) =>
      [...queryKeys.bookings.lists(), "worker", workerId, filters] as const,
    details: () => [...queryKeys.bookings.all, "detail"] as const,
    detail: (bookingId: string) =>
      [...queryKeys.bookings.details(), bookingId] as const,
    timeline: (bookingId: string) =>
      [...queryKeys.bookings.detail(bookingId), "timeline"] as const,
  },

  /**
   * 5. Quotations & Cost Estimates
   */
  quotations: {
    all: ["quotations"] as const,
    byBooking: (bookingId: string) =>
      [...queryKeys.quotations.all, "booking", bookingId] as const,
    details: () => [...queryKeys.quotations.all, "detail"] as const,
    detail: (quoteId: string) =>
      [...queryKeys.quotations.details(), quoteId] as const,
    workerPendingQuotes: (workerId: string) =>
      [...queryKeys.quotations.all, "worker", workerId, "pending"] as const,
  },

  /**
   * 6. Real-Time Chat & Direct Messaging
   */
  chat: {
    all: ["chat"] as const,
    threads: () => [...queryKeys.chat.all, "threads"] as const,
    thread: (threadId: string) =>
      [...queryKeys.chat.all, "thread", threadId] as const,
    messages: (threadId: string, page = 1) =>
      [...queryKeys.chat.thread(threadId), "messages", { page }] as const,
    unreadCount: () => [...queryKeys.chat.all, "unread-count"] as const,
  },

  /**
   * 7. Payments, Invoices & Earnings
   */
  payments: {
    all: ["payments"] as const,
    earnings: (workerId?: string, period?: "week" | "month" | "year" | "all") =>
      [...queryKeys.payments.all, "earnings", workerId, period] as const,
    history: (userId?: string, page = 1) =>
      [...queryKeys.payments.all, "history", userId, { page }] as const,
    invoices: (bookingId?: string) =>
      [...queryKeys.payments.all, "invoices", bookingId] as const,
    payoutMethods: (workerId?: string) =>
      [...queryKeys.payments.all, "payout-methods", workerId] as const,
  },

  /**
   * 8. Ratings, Reviews & Feedback
   */
  ratings: {
    all: ["ratings"] as const,
    summary: (workerId: string) =>
      [...queryKeys.ratings.all, "summary", workerId] as const,
    byBooking: (bookingId: string) =>
      [...queryKeys.ratings.all, "booking", bookingId] as const,
  },

  /**
   * 9. Admin Portals, Verification Queue & Disputes
   */
  admin: {
    all: ["admin"] as const,
    verificationQueue: (filters?: { status?: string; page?: number }) =>
      [...queryKeys.admin.all, "verification-queue", filters] as const,
    disputes: (filters?: DisputeFilters) =>
      [...queryKeys.admin.all, "disputes", filters] as const,
    disputeDetail: (disputeId: string) =>
      [...queryKeys.admin.all, "dispute", disputeId] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
  },

  /**
   * 10. Notifications
   */
  notifications: {
    all: ["notifications"] as const,
    list: (page = 1) => [...queryKeys.notifications.all, "list", { page }] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
  },
} as const;

export default queryKeys;
