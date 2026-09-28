import { authClient } from "@/lib/auth-client";
import { API_TIMEOUTS } from "@/lib/constants";
import { env } from "@/env";

/**
 * Resolves the API Base URL from environment or explicit override.
 * Throws if the base URL is not configured (e.g. in misconfigured production environments).
 */
function getApiBaseUrl(override?: string): string {
  const base = override || env.NEXT_PUBLIC_API_BASE_URL;

  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

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
   * Skip automatic token re-acquisition/retry on 401 Unauthorized
   */
  skipTokenReacquisition?: boolean;

  /**
   * Backward-compatible alias for skipTokenReacquisition
   */
  skipAuthRefresh?: boolean;

  /**
   * Override default base URL (defaults to env.NEXT_PUBLIC_API_BASE_URL)
   */
  baseUrl?: string;

  /**
   * Internal retry guard to ensure 401 token re-acquisition is attempted at most once
   */
  _retry?: boolean;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * In-Memory JWT Access Token Storage & Security Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication Architecture Between Next.js & Downstream C# API:
 * 1. Master Session (Cookie): Better Auth persists authentication state securely
 *    in HTTP-only cookies. Browser JavaScript CANNOT read or exfiltrate the master
 *    session cookie.
 * 2. Downstream API Authorization (Bearer JWT): To communicate cross-origin with
 *    the downstream C# API, browser JavaScript requests a short-lived JWT from
 *    Better Auth (`authClient.token()`) and attaches it to:
 *      Authorization: Bearer <JWT>
 *    Because browser JavaScript must read this JWT to set the header, the JWT IS
 *    necessarily accessible in JavaScript memory during its active lifetime.
 * 3. Mitigation — Strict In-Memory Storage:
 *    We store this JWT STRICTLY in a private JavaScript module variable (`inMemoryAccessToken`).
 *    We NEVER persist it in `localStorage` or `sessionStorage`.
 *    - Eliminates persistent XSS token theft across tabs, browser restarts, and
 *      storage-scanning malicious scripts or browser extensions.
 *    - If the page reloads, the in-memory variable clears, and the client seamlessly
 *      re-mints a fresh short-lived JWT via the secure HTTP-only session cookie.
 */
let inMemoryAccessToken: string | null = null;

export function getAuthToken(): string | null {
  return inMemoryAccessToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearAuthTokens(): void {
  inMemoryAccessToken = null;
}

/** @deprecated Kept for backward compatibility; Better Auth does not use client-side refresh tokens */
export const getRefreshToken = (): null => null;
export const setRefreshToken = (_token?: string | null): void => {};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth JWT Token Acquisition & 401 Re-acquisition
 * ─────────────────────────────────────────────────────────────────────────────
 * Before each request, apiClient asks Better Auth's client for a signed JWT
 * minted from its active HTTP-only session cookie.
 *
 * NOTE ON TERMINOLOGY:
 * Better Auth is session-cookie-backed, NOT a traditional OAuth refresh-token system.
 * The client does not possess or rotate a refresh token; instead, the browser
 * provides the HTTP-only session cookie to Better Auth's `/api/auth/token` endpoint,
 * which issues the short-lived JWT for the downstream C# backend.
 *
 * On a 401 from the C# backend, apiClient re-acquires a fresh JWT from Better Auth
 * once (deduplicating concurrent 401s), retries the request, then gives up.
 */
export type BetterAuthTokenResolver = (options?: {
  forceRefresh?: boolean;
}) => Promise<string | null>;

let customTokenResolver: BetterAuthTokenResolver | null = null;
let activeAuthClient = authClient;

/**
 * Allows registering a custom token resolver (e.g. for testing or external mocks)
 */
export function setBetterAuthTokenResolver(
  resolver: BetterAuthTokenResolver | null
): void {
  customTokenResolver = resolver;
}

/**
 * Allows overriding or mocking the Better Auth client instance
 */
export function setBetterAuthClient(
  client: typeof authClient
): void {
  activeAuthClient = client;
}

// Backward-compatible alias for existing callers
export const setCustomRefreshHandler = setBetterAuthTokenResolver;
export type CustomRefreshHandler = BetterAuthTokenResolver;

/**
 * Acquires a JWT from Better Auth's client or the in-memory cache.
 *
 * NOTE ON forceRefresh & Better Auth:
 * Better Auth's client method `activeAuthClient.token()` maps directly to GET /api/auth/token.
 * On the server, this endpoint takes no options or forceRefresh parameter; it always mints
 * a fresh signed JWT from the session cookie.
 *
 * In this client pipeline, `forceRefresh?: boolean` acts as a client-side cache control:
 * - When false/omitted: if an in-memory token is already available, it is returned immediately,
 *   preventing redundant roundtrips to Better Auth's /api/auth/token on every single API request.
 * - When true (e.g. on 401 Unauthorized): the in-memory cache is bypassed, explicitly asking
 *   Better Auth to mint a fresh JWT from the session cookie.
 */
export async function getBetterAuthJwt(options?: {
  forceRefresh?: boolean;
}): Promise<string | null> {
  // 1. Return in-memory cached token if present and not forcing refresh
  if (!options?.forceRefresh && inMemoryAccessToken) {
    return inMemoryAccessToken;
  }

  // 2. If an explicit resolver is configured, delegate to it
  if (customTokenResolver) {
    try {
      const token = await customTokenResolver(options);
      if (token) {
        setAuthToken(token);
        return token;
      }
      return null;
    } catch {
      return null;
    }
  }

  // 3. Otherwise, query Better Auth's /api/auth/token endpoint
  try {
    const { data, error } = await activeAuthClient.token();
    if (!error && data?.token) {
      setAuthToken(data.token);
      return data.token;
    }
  } catch {
    // Better Auth client error or unauthenticated
  }

  // When forceRefresh is requested and Better Auth returns no token, the session is dead
  if (options?.forceRefresh) {
    clearAuthTokens();
    return null;
  }

  return inMemoryAccessToken;
}

/**
 * Concurrency-safe token re-acquisition:
 * Multiple concurrent 401s from the C# API reuse a single pending re-acquisition promise
 * to avoid duplicate token requests and race conditions.
 */
let reacquirePromise: Promise<string | null> | null = null;

export async function reacquireBetterAuthToken(): Promise<string | null> {
  if (!reacquirePromise) {
    reacquirePromise = (async () => {
      try {
        const freshToken = await getBetterAuthJwt({ forceRefresh: true });
        if (freshToken) {
          return freshToken;
        }
        clearAuthTokens();
        return null;
      } catch {
        clearAuthTokens();
        return null;
      }
    })().finally(() => {
      reacquirePromise = null;
    });
  }
  return reacquirePromise;
}

// Backward-compatible aliases for existing consumers
export const reAskBetterAuthToken = reacquireBetterAuthToken;
export const silentRefresh = reacquireBetterAuthToken;

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
    skipTokenReacquisition = false,
    skipAuthRefresh = false,
    baseUrl,
    _retry = false,
    headers: customHeaders = {},
    method = "GET",
    ...restOptions
  } = options;

  const shouldSkipReacquisition = skipTokenReacquisition || skipAuthRefresh;
  const url = buildUrl(path, params, baseUrl);
  const headers = new Headers(customHeaders);

  // Set default Accept header if not already provided
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // 1. Ask Better Auth's client for current JWT and attach as Bearer token
  if (!skipAuth && !headers.has("Authorization")) {
    const token = await getBetterAuthJwt();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // 2. Prepare Body and Content-Type
  let resolvedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      resolvedBody = body;
      // Fetch will automatically generate multipart/form-data with proper boundary;
      // remove any pre-existing Content-Type to prevent collisions.
      headers.delete("Content-Type");
    } else if (
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof URLSearchParams
    ) {
      resolvedBody = body;
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

  // 3. Pre-flight Abort Check
  if (restOptions.signal?.aborted) {
    throw new ApiError({
      message: "Request was cancelled",
      status: 499,
      statusText: "Client Closed Request",
      url,
      method,
    });
  }

  // 4. Timeout & AbortSignal Controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  const handleExternalAbort = () => {
    controller.abort(restOptions.signal?.reason);
  };

  if (restOptions.signal) {
    restOptions.signal.addEventListener("abort", handleExternalAbort, {
      once: true,
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

    // 4. Token Re-acquisition on 401 (Authentication Failure Only)
    // ARCHITECTURE CONTRACT (C# API <-> Next.js Frontend):
    // • 401 Unauthorized = Authentication problem (token expired, missing, or invalid signature).
    //   The frontend attempts a single-attempt re-acquisition of a fresh JWT from Better Auth's cookie session.
    // • 403 Forbidden = Authorization problem (user is authenticated, but lacks required role or permission,
    //   e.g. customer attempting a worker-only endpoint).
    //   The frontend MUST NOT perform token re-acquisition on 403 — re-minting a JWT does not alter user role,
    //   and retrying would waste roundtrips or spuriously wipe the active session.
    if (response.status === 401 && !_retry && !shouldSkipReacquisition) {
      const freshToken = await reacquireBetterAuthToken();

      if (freshToken) {
        // Retry the original request once with the re-acquired Bearer token
        const retryHeaders = new Headers(customHeaders);
        retryHeaders.set("Authorization", `Bearer ${freshToken}`);

        return await request<T>(path, {
          ...options,
          headers: retryHeaders,
          _retry: true,
        });
      }

      // Re-acquiring from Better Auth yielded no token — session expired or user logged out
      throw new ApiError({
        message: "Session expired or unauthorized. Please log in again.",
        status: 401,
        statusText: "Unauthorized",
        url,
        method,
      });
    }

    // 5. Handle non-2xx Failure Responses (including repeated 401 when _retry is true)
    if (!response.ok) {
      let errorData: ApiProblemDetails | null = null;
      const text = await response.text().catch(() => "");
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch {
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

    const text = await response.text();
    if (!text || !text.trim()) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    }

    return text as unknown as T;
  } catch (error: unknown) {
    if (isApiError(error)) {
      throw error;
    }

    if (restOptions.signal?.aborted) {
      throw new ApiError({
        message: "Request was cancelled",
        status: 499,
        statusText: "Client Closed Request",
        url,
        method,
      });
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
  } finally {
    clearTimeout(timeoutId);
    if (restOptions.signal) {
      restOptions.signal.removeEventListener("abort", handleExternalAbort);
    }
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Public API Client Singleton
 * ─────────────────────────────────────────────────────────────────────────────
 * The single, unified place fetch calls go through.
 * Attaches the auth header via Better Auth, re-asks once on 401, and throws typed ApiError.
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
