import { API_TIMEOUTS, STORAGE_KEYS } from "@/lib/constants";

/**
 * Resolves the API Base URL from environment or defaults
 */
function getApiBaseUrl(override?: string): string {
  const base =
    override ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://localhost:5001";
  return base.replace(/\/+$/, "");
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed API Error & Problem Details (RFC 7807 compatible)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly data: ApiProblemDetails | null;
  public readonly code?: string;
  public readonly url?: string;
  public readonly method?: string;

  constructor({
    message,
    status,
    statusText,
    data = null,
    url,
    method,
  }: {
    message: string;
    status: number;
    statusText: string;
    data?: ApiProblemDetails | null;
    url?: string;
    method?: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.code =
      data?.code || (data?.status ? `HTTP_${data.status}` : `HTTP_${status}`);
    this.url = url;
    this.method = method;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Type guard for ApiError instances
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Request Configuration & Options
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type QueryParamValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Array<string | number | boolean>;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /**
   * Query parameters to append to the request URL
   */
  params?: Record<string, QueryParamValue>;

  /**
   * Request body (automatically JSON serialized if plain object or array)
   */
  body?: unknown;

  /**
   * Request timeout in milliseconds (defaults to API_TIMEOUTS.DEFAULT)
   */
  timeout?: number;

  /**
   * Skip attaching the Authorization header
   */
  skipAuth?: boolean;

  /**
   * Skip automatic silent refresh on 401 Unauthorized
   */
  skipAuthRefresh?: boolean;

  /**
   * Override default base URL (defaults to env.NEXT_PUBLIC_API_BASE_URL)
   */
  baseUrl?: string;

  /**
   * Internal retry guard to ensure 401 refresh is attempted at most once
   */
  _retry?: boolean;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Token Management & Storage Helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export function getAuthToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch {
      // Storage unavailable or disabled
    }
  }
}

export function getRefreshToken(): string | null {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  }
  return null;
}

export function setRefreshToken(token: string | null): void {
  inMemoryRefreshToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch {
      // Storage unavailable or disabled
    }
  }
}

export function clearAuthTokens(): void {
  setAuthToken(null);
  setRefreshToken(null);
}

/**
 * Custom refresh handler type to allow pluggable auth store integration
 */
export type CustomRefreshHandler = () => Promise<string | null>;
let customRefreshHandler: CustomRefreshHandler | null = null;

export function setCustomRefreshHandler(
  handler: CustomRefreshHandler | null
): void {
  customRefreshHandler = handler;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Concurrency-Safe Silent Token Refresh
 * ─────────────────────────────────────────────────────────────────────────────
 * Multiple concurrent 401s reuse a single pending refresh promise to avoid
 * duplicate refresh calls and token rotation race conditions.
 */
let refreshPromise: Promise<string | null> | null = null;
const REFRESH_ENDPOINT = "/api/v1/auth/refresh";

async function performSilentRefresh(): Promise<string | null> {
  // If an external auth store (e.g. authStore) provided a custom handler, delegate to it
  if (customRefreshHandler) {
    try {
      const newToken = await customRefreshHandler();
      if (newToken) setAuthToken(newToken);
      return newToken;
    } catch {
      clearAuthTokens();
      return null;
    }
  }

  const refreshToken = getRefreshToken();
  const baseUrl = getApiBaseUrl();
  const refreshUrl = `${baseUrl}${REFRESH_ENDPOINT}`;

  try {
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        refreshToken: refreshToken || undefined,
      }),
    });

    if (!response.ok) {
      clearAuthTokens();
      return null;
    }

    const data = await response.json().catch(() => null);
    const newAccessToken =
      data?.accessToken ||
      data?.token ||
      data?.data?.accessToken ||
      data?.data?.token;
    const newRefreshToken =
      data?.refreshToken || data?.data?.refreshToken;

    if (newAccessToken && typeof newAccessToken === "string") {
      setAuthToken(newAccessToken);
      if (newRefreshToken && typeof newRefreshToken === "string") {
        setRefreshToken(newRefreshToken);
      }
      return newAccessToken;
    }

    clearAuthTokens();
    return null;
  } catch {
    clearAuthTokens();
    return null;
  }
}

export async function silentRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performSilentRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * URL & Query Formatting Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 */
function buildUrl(
  path: string,
  params?: Record<string, QueryParamValue>,
  baseUrlOverride?: string
): string {
  let fullUrl: string;

  if (/^https?:\/\//i.test(path)) {
    fullUrl = path;
  } else {
    const base = getApiBaseUrl(baseUrlOverride);
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    fullUrl = `${base}${cleanPath}`;
  }

  if (!params || Object.keys(params).length === 0) {
    return fullUrl;
  }

  const url = new URL(fullUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          url.searchParams.append(key, String(v));
        }
      });
    } else {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

function extractErrorMessage(
  data: ApiProblemDetails | null,
  statusText: string
): string {
  if (!data) return statusText || "Request failed";

  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data.title === "string" && data.title.trim()) {
    return data.title;
  }
  if (data.errors && typeof data.errors === "object") {
    const errorMessages = Object.entries(data.errors)
      .map(([field, msgs]) =>
        Array.isArray(msgs) ? `${field}: ${msgs.join(", ")}` : `${field}: ${msgs}`
      )
      .filter(Boolean);
    if (errorMessages.length > 0) {
      return errorMessages.join("; ");
    }
  }

  return statusText || "An unexpected API error occurred";
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Core Fetch Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    body,
    timeout = API_TIMEOUTS.DEFAULT,
    skipAuth = false,
    skipAuthRefresh = false,
    baseUrl,
    _retry = false,
    headers: customHeaders = {},
    method = "GET",
    ...restOptions
  } = options;

  const url = buildUrl(path, params, baseUrl);
  const headers = new Headers(customHeaders);

  // Set default Accept header if not already provided
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // 1. Attach Auth Header if enabled
  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // 2. Prepare Body and Content-Type
  let resolvedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof URLSearchParams
    ) {
      resolvedBody = body;
      // Fetch will automatically generate the correct Content-Type (with boundary for FormData)
    } else if (typeof body === "string") {
      resolvedBody = body;
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain;charset=UTF-8");
      }
    } else {
      resolvedBody = JSON.stringify(body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  // 3. Timeout Controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // If user provided their own signal, listen to it
  if (restOptions.signal) {
    restOptions.signal.addEventListener("abort", () => {
      controller.abort();
    });
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      method,
      headers,
      body: resolvedBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 4. Handle 401 Unauthorized with Silent Refresh (retry at most once)
    const isRefreshPath =
      path.includes(REFRESH_ENDPOINT) || url.includes(REFRESH_ENDPOINT);

    if (
      response.status === 401 &&
      !_retry &&
      !skipAuthRefresh &&
      !isRefreshPath
    ) {
      const newToken = await silentRefresh();

      if (newToken) {
        // Retry the original request once with new token
        return await request<T>(path, {
          ...options,
          _retry: true,
        });
      }

      // Refresh failed or returned null — throw typed 401 ApiError
      throw new ApiError({
        message: "Session expired or unauthorized. Please log in again.",
        status: 401,
        statusText: "Unauthorized",
        url,
        method,
      });
    }

    // 5. Handle non-2xx Failure Responses
    if (!response.ok) {
      let errorData: ApiProblemDetails | null = null;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        errorData = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => "");
        if (text) {
          errorData = { detail: text };
        }
      }

      const errorMessage = extractErrorMessage(errorData, response.statusText);

      throw new ApiError({
        message: errorMessage,
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        url,
        method,
      });
    }

    // 6. Handle Successful Responses
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (isApiError(error)) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError({
        message: `Request to ${url} timed out after ${timeout}ms`,
        status: 408,
        statusText: "Request Timeout",
        url,
        method,
      });
    }

    throw new ApiError({
      message:
        error instanceof Error ? error.message : "A network error occurred",
      status: 0,
      statusText: "Network Error",
      url,
      method,
    });
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Public API Client Singleton
 * ─────────────────────────────────────────────────────────────────────────────
 * The single, unified place fetch calls go through.
 */
export const apiClient = {
  request,

  get<T = unknown>(
    path: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return request<T>(path, { ...options, method: "POST", body });
  },

  put<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T = unknown>(
    path: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

export default apiClient;
