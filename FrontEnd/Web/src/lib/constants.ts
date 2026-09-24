/**
 * API Configuration Constants
 * 
 * Centralized API configuration values including timeouts and retry logic.
 * All timeout values are in milliseconds.
 */
export const API_TIMEOUTS = {
  /** Default timeout for standard API requests (30 seconds) */
  DEFAULT: 30000,
  /** Extended timeout for file upload operations (2 minutes) */
  UPLOAD: 120000,
  /** Extended timeout for file download operations (1 minute) */
  DOWNLOAD: 60000,
} as const;

/**
 * API Retry Configuration
 * 
 * Defines retry behavior for failed API requests.
 */
export const API_RETRY = {
  /** Maximum number of retry attempts for failed requests */
  MAX_ATTEMPTS: 3,
  /** Base delay in milliseconds between retry attempts */
  BACKOFF_MS: 1000,
} as const;

/**
 * Pagination Configuration
 * 
 * Defines default pagination behavior across the application.
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum allowed page size */
  MAX_PAGE_SIZE: 100,
  /** Minimum allowed page size */
  MIN_PAGE_SIZE: 10,
  /** Default starting page number (1-indexed) */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Application Routes
 * 
 * Centralized route path constants for all application pages.
 * Organized by user role and functionality.
 */
export const ROUTES = {
  /** Root/home page */
  HOME: '/',
  
  /** Authentication routes */
  AUTH: {
    /** Login page */
    LOGIN: '/login',
    /** OTP verification page */
    VERIFY_OTP: '/verify-otp',
  },
  
  /** Customer-facing routes */
  CUSTOMER: {
    /** Worker search page */
    SEARCH: '/search',
    /** Customer bookings list */
    BOOKINGS: '/bookings',
    /** Worker profiles base path */
    WORKERS: '/workers',
    /** Chat/messaging base path */
    CHAT: '/chat',
  },
  
  /** Worker-facing routes */
  WORKER: {
    /** Worker dashboard */
    DASHBOARD: '/dashboard',
    /** Job listings and management */
    JOBS: '/jobs',
    /** Earnings and payment history */
    EARNINGS: '/earnings',
  },
  
  /** Admin routes */
  ADMIN: {
    /** Worker verification queue */
    VERIFICATION_QUEUE: '/verification-queue',
    /** Dispute management */
    DISPUTES: '/disputes',
  },
} as const;

/**
 * Dynamic Route Helpers
 * 
 * Helper functions for generating parameterized route paths.
 */

/**
 * Generate route path for a specific worker profile
 * @param workerId - The unique identifier of the worker
 * @returns Route path to the worker's profile page
 */
export const getWorkerProfileRoute = (workerId: string): string => 
  `${ROUTES.CUSTOMER.WORKERS}/${workerId}`;

/**
 * Generate route path for a specific booking
 * @param bookingId - The unique identifier of the booking
 * @returns Route path to the booking detail page
 */
export const getBookingDetailRoute = (bookingId: string): string => 
  `${ROUTES.CUSTOMER.BOOKINGS}/${bookingId}`;

/**
 * Generate route path for a specific chat thread
 * @param threadId - The unique identifier of the chat thread
 * @returns Route path to the chat conversation
 */
export const getChatThreadRoute = (threadId: string): string => 
  `${ROUTES.CUSTOMER.CHAT}/${threadId}`;

/**
 * Generate route path for a specific job
 * @param jobId - The unique identifier of the job
 * @returns Route path to the job detail page
 */
export const getJobDetailRoute = (jobId: string): string => 
  `${ROUTES.WORKER.JOBS}/${jobId}`;

/**
 * Validation Constraints
 * 
 * Defines validation rules for user input across the application.
 * These constraints ensure data consistency and security.
 */
export const VALIDATION = {
  /** Password length constraints for authentication */
  PASSWORD: {
    /** Minimum password length to ensure basic security */
    MIN_LENGTH: 8,
    /** Maximum password length to prevent excessive input */
    MAX_LENGTH: 128,
  },
  /** Username length constraints */
  USERNAME: {
    /** Minimum username length for meaningful identifiers */
    MIN_LENGTH: 3,
    /** Maximum username length for display compatibility */
    MAX_LENGTH: 30,
  },
  /** Maximum length for user bio text (worker profiles, etc.) */
  BIO_MAX_LENGTH: 500,
  /** Maximum length for chat messages */
  MESSAGE_MAX_LENGTH: 2000,
  /** 
   * Regular expression for phone number validation in E.164 format
   * E.164 format: +[country code][number]
   * Examples: +1234567890, +447911123456
   * - Must start with optional + followed by 1-9
   * - Total length between 2 and 15 digits after country code
   */
  PHONE_REGEX: /^\+[1-9]\d{1,14}$/,
} as const;

/**
 * Date and Time Formatting
 * 
 * Defines consistent date/time format strings for use with date-fns or similar libraries.
 * All formats follow the date-fns format token syntax.
 */
export const DATE_FORMAT = {
  /** Display format for dates: "Jan 15, 2024" */
  DISPLAY: 'MMM dd, yyyy',
  /** Display format with time: "Jan 15, 2024 14:30" */
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  /** ISO 8601 date format: "2024-01-15" */
  ISO: 'yyyy-MM-dd',
  /** ISO 8601 datetime format: "2024-01-15T14:30:00" */
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
  /** Time only format: "14:30" (24-hour) */
  TIME_ONLY: 'HH:mm',
  /** Date for file naming: "2024-01-15" */
  FILE_NAME: 'yyyy-MM-dd',
  /** Full datetime for file naming: "2024-01-15_143000" */
  FILE_NAME_WITH_TIME: 'yyyy-MM-dd_HHmmss',
} as const;

/**
 * File Upload Constraints
 * 
 * Defines file size limits and allowed MIME types for file uploads.
 * Used for validation on both client and server sides.
 */
export const FILE_UPLOAD = {
  /** Maximum file size in megabytes */
  MAX_SIZE_MB: 5,
  /** Maximum file size in bytes (5MB) */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  /** Allowed image MIME types for profile pictures and general images */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Allowed document MIME types for verification documents */
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  /** 
   * Human-readable error messages for file validation failures
   * Can be used directly in UI error displays
   */
  ERROR_MESSAGES: {
    SIZE_EXCEEDED: 'File size must not exceed 5MB',
    INVALID_TYPE: 'Invalid file type. Please upload a valid image or document.',
  },
} as const;

/**
 * SignalR Connection Configuration
 * 
 * Defines WebSocket connection parameters for real-time features (chat, notifications).
 * Controls reconnection behavior and timeout settings.
 */
export const SIGNALR = {
  /** Delay in milliseconds before attempting to reconnect after disconnection */
  RECONNECT_DELAY_MS: 5000,
  /** Maximum number of reconnection attempts before giving up */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Connection timeout in milliseconds */
  TIMEOUT_MS: 30000,
  /** Keep-alive interval in milliseconds (ping frequency) */
  KEEP_ALIVE_INTERVAL_MS: 15000,
} as const;

/**
 * Local Storage Keys
 * 
 * Centralized storage key constants for localStorage and sessionStorage.
 * Using prefixed keys prevents conflicts with other applications.
 */
export const STORAGE_KEYS = {
  /** Authentication token storage key */
  AUTH_TOKEN: 'skilld_auth_token',
  /** Refresh token storage key for silent re-authentication */
  REFRESH_TOKEN: 'skilld_refresh_token',
  /** User preferences (theme, language, etc.) storage key */
  USER_PREFERENCES: 'skilld_user_prefs',
  /** Last search query and filters storage key */
  LAST_SEARCH: 'skilld_last_search',
  /** Onboarding completion status */
  ONBOARDING_COMPLETED: 'skilld_onboarding_completed',
  /** Draft messages (for offline resilience) */
  DRAFT_MESSAGES: 'skilld_draft_messages',
} as const;

/**
 * Worker and Service Skill Categories
 * 
 * Centralized list of primary skill categories supported across search, worker
 * profiles, quotations, and job postings. Both developers reference this enum.
 */
export const WORKER_CATEGORIES = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  CARPENTRY: 'carpentry',
  PAINTING: 'painting',
  HVAC: 'hvac',
  CLEANING: 'cleaning',
  CONSTRUCTION: 'construction',
  APPLIANCE_REPAIR: 'appliance_repair',
  AUTOMOTIVE: 'automotive',
  WELDING: 'welding',
  HANDYMAN: 'handyman',
  ROOFING: 'roofing',
  LANDSCAPING: 'landscaping',
  DESIGN: 'design',
  PROGRAMMING: 'programming',
  DIGITAL_MARKETING: 'digital_marketing',
} as const;

export type WorkerCategory = (typeof WORKER_CATEGORIES)[keyof typeof WORKER_CATEGORIES];

/**
 * Human-readable display labels for worker skill categories
 */
export const WORKER_CATEGORY_LABELS: Record<WorkerCategory, string> = {
  [WORKER_CATEGORIES.PLUMBING]: 'Plumbing',
  [WORKER_CATEGORIES.ELECTRICAL]: 'Electrical',
  [WORKER_CATEGORIES.CARPENTRY]: 'Carpentry',
  [WORKER_CATEGORIES.PAINTING]: 'Painting',
  [WORKER_CATEGORIES.HVAC]: 'HVAC & AC Repair',
  [WORKER_CATEGORIES.CLEANING]: 'Cleaning & Janitorial',
  [WORKER_CATEGORIES.CONSTRUCTION]: 'Construction & Masonry',
  [WORKER_CATEGORIES.APPLIANCE_REPAIR]: 'Appliance Repair',
  [WORKER_CATEGORIES.AUTOMOTIVE]: 'Automotive & Mechanic',
  [WORKER_CATEGORIES.WELDING]: 'Welding & Metalwork',
  [WORKER_CATEGORIES.HANDYMAN]: 'General Handyman',
  [WORKER_CATEGORIES.ROOFING]: 'Roofing',
  [WORKER_CATEGORIES.LANDSCAPING]: 'Landscaping & Gardening',
  [WORKER_CATEGORIES.DESIGN]: 'Design & Creative',
  [WORKER_CATEGORIES.PROGRAMMING]: 'Programming & Tech',
  [WORKER_CATEGORIES.DIGITAL_MARKETING]: 'Digital Marketing',
} as const;

export const WORKER_CATEGORIES_LIST = Object.values(WORKER_CATEGORIES);

/**
 * Booking Lifecycle Statuses
 * 
 * Represents the complete state machine for service bookings and jobs.
 * Used across customer booking flows, worker dashboards, and admin disputes.
 */
export const BOOKING_STATUSES = {
  /** Booking created, waiting for worker review or quotation */
  PENDING: 'pending',
  /** Worker accepted booking request or quote approved */
  ACCEPTED: 'accepted',
  /** Worker declined or rejected booking request */
  REJECTED: 'rejected',
  /** Work is currently underway */
  IN_PROGRESS: 'in_progress',
  /** Service finished, awaiting client signoff or release */
  COMPLETED: 'completed',
  /** Booking cancelled by customer or worker prior to start */
  CANCELLED: 'cancelled',
  /** Dispute raised, under mediation by admin */
  DISPUTED: 'disputed',
  /** Payment reversed or refunded */
  REFUNDED: 'refunded',
} as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[keyof typeof BOOKING_STATUSES];

/**
 * Human-readable labels for booking statuses
 */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BOOKING_STATUSES.PENDING]: 'Pending Confirmation',
  [BOOKING_STATUSES.ACCEPTED]: 'Accepted',
  [BOOKING_STATUSES.REJECTED]: 'Declined',
  [BOOKING_STATUSES.IN_PROGRESS]: 'In Progress',
  [BOOKING_STATUSES.COMPLETED]: 'Completed',
  [BOOKING_STATUSES.CANCELLED]: 'Cancelled',
  [BOOKING_STATUSES.DISPUTED]: 'Disputed',
  [BOOKING_STATUSES.REFUNDED]: 'Refunded',
} as const;

export const BOOKING_STATUSES_LIST = Object.values(BOOKING_STATUSES);

/**
 * React Query Stale Times (in milliseconds)
 * 
 * Standardized caching durations used across TanStack Query hooks so developers
 * never guess or hardcode cache invalidation windows.
 */
export const STALE_TIME = {
  /** Never cache / always fetch fresh: 0 ms */
  INSTANT: 0,
  /** Short-lived live data (worker coordinates, live job status): 30 seconds */
  SHORT: 30 * 1000,
  /** Standard default stale duration: 1 minute (60,000 ms) */
  DEFAULT: 60 * 1000,
  /** Medium duration for listings & search results: 5 minutes */
  MEDIUM: 5 * 60 * 1000,
  /** Long duration for user profiles & worker portfolios: 15 minutes */
  LONG: 15 * 60 * 1000,
  /** Very long duration for static options & platform taxonomy: 1 hour */
  VERY_LONG: 60 * 60 * 1000,
  /** Infinite stale time for immutable reference data */
  INFINITY: Infinity,
} as const;

/**
 * Debounce Delay Constants (in milliseconds)
 * 
 * Standardized debounce timings for search inputs, form autosave, and filters.
 */
export const DEBOUNCE_MS = {
  /** Default input debounce delay: 300 ms */
  DEFAULT: 300,
  /** Search bar and keyword query inputs: 350 ms */
  SEARCH: 350,
  /** Location and address autocomplete queries: 500 ms */
  LOCATION: 500,
  /** Filter changes and range sliders: 250 ms */
  FILTER: 250,
  /** Autosave form drafts to storage/API: 1000 ms (1s) */
  AUTOSAVE: 1000,
  /** Window resize and scroll events: 150 ms */
  WINDOW_EVENT: 150,
} as const;

