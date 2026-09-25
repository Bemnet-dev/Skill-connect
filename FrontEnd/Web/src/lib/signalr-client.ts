import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
  type IHttpConnectionOptions,
} from "@microsoft/signalr";
import { SIGNALR } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";
import { getAuthToken } from "@/lib/api-client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SignalR Client Connection Builder
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds the SignalR connection with the access token attached — used only by
 * SocketProvider.
 *
 * Encapsulates hub URL resolution, token injection, automatic reconnection,
 * timeouts, and transport negotiation in one centralized place.
 */

export interface BuildSignalRConnectionOptions {
  /**
   * Custom hub URL override. Defaults to NEXT_PUBLIC_SIGNALR_HUB_URL or fallback.
   */
  hubUrl?: string;

  /**
   * Custom access token factory override.
   * Defaults to reading the current JWT from Better Auth's client.
   */
  accessTokenFactory?: () => string | Promise<string>;

  /**
   * Minimum logging severity. Defaults to Warning in production, Information in dev.
   */
  logLevel?: LogLevel;

  /**
   * Allowed transport types. Defaults to WebSockets with LongPolling fallback.
   */
  transport?: HttpTransportType;

  /**
   * Direct overrides for underlying @microsoft/signalr connection options.
   */
  connectionOptions?: Partial<IHttpConnectionOptions>;
}

/**
 * Resolves the SignalR hub URL from environment or defaults
 */
export function getSignalRHubUrl(override?: string): string {
  const url =
    override ||
    process.env.NEXT_PUBLIC_SIGNALR_HUB_URL ||
    "https://localhost:5001/hubs/realtime";
  return url.replace(/\/+$/, "");
}

/**
 * Builds and configures a HubConnection instance with automatic reconnection,
 * keep-alive timeouts, and the access token attached.
 *
 * @param options - Optional configuration overrides
 * @returns A fully configured, ready-to-start HubConnection instance
 */
export function buildSignalRConnection(
  options: BuildSignalRConnectionOptions = {}
): HubConnection {
  const hubUrl = getSignalRHubUrl(options.hubUrl);

  // Default token factory attaches the current JWT from Better Auth's client
  const defaultAccessTokenFactory = async (): Promise<string> => {
    try {
      const { data, error } = await authClient.token();
      if (!error && data?.token) {
        return data.token;
      }
    } catch {
      // Silently fall back to cached token if Better Auth is unreachable
    }
    const token = getAuthToken();
    return token ?? "";
  };

  const tokenFactory = options.accessTokenFactory || defaultAccessTokenFactory;

  const defaultLogLevel =
    process.env.NODE_ENV === "production"
      ? LogLevel.Warning
      : LogLevel.Information;

  const httpConnectionOptions: IHttpConnectionOptions = {
    accessTokenFactory: tokenFactory,
    transport:
      options.transport ??
      (HttpTransportType.WebSockets | HttpTransportType.LongPolling),
    ...options.connectionOptions,
  };

  const builder = new HubConnectionBuilder()
    .withUrl(hubUrl, httpConnectionOptions)
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Enforce maximum reconnect attempts from centralized constants
        if (retryContext.previousRetryCount >= SIGNALR.MAX_RECONNECT_ATTEMPTS) {
          return null; // Stop reconnecting after exceeding limit
        }
        return SIGNALR.RECONNECT_DELAY_MS;
      },
    })
    .configureLogging(options.logLevel ?? defaultLogLevel);

  const connection = builder.build();

  // Configure timeouts and keep-alive ping frequencies from centralized constants
  connection.serverTimeoutInMilliseconds = SIGNALR.TIMEOUT_MS;
  connection.keepAliveIntervalInMilliseconds = SIGNALR.KEEP_ALIVE_INTERVAL_MS;

  return connection;
}

// Alias for semantic flexibility
export const createSignalRConnection = buildSignalRConnection;

export default buildSignalRConnection;

// Re-export common SignalR types for consumers (e.g. SocketProvider)
export {
  HubConnection,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
};
