"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  buildSignalRConnection,
  HubConnection,
  HubConnectionState,
} from "@/lib/signalr-client";
import { authClient } from "@/lib/auth-client";

let activeAuthClient = authClient;

/**
 * Allows overriding or mocking the Better Auth client instance for SocketProvider.
 * Preferred approach is passing authClient directly into <SocketProvider authClient={...} />.
 */
export function setBetterAuthClient(client: typeof authClient): void {
  activeAuthClient = client;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Token Factory for SignalR
 * ─────────────────────────────────────────────────────────────────────────────
 * Pulls the current JWT directly from Better Auth's client.
 * Better Auth manages session refresh and token minting internally.
 */
export async function getSocketAccessToken(
  client: typeof authClient = activeAuthClient
): Promise<string> {
  try {
    const { data, error } = await client.token();
    if (!error && data?.token) {
      return data.token;
    }
  } catch {
    // Unauthenticated or network issue
  }
  return "";
}

export interface SocketContextType {
  connection: HubConnection | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  connectionState: HubConnectionState;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (eventName: string, handler: (...args: unknown[]) => void) => () => void;
  off: (eventName: string, handler?: (...args: unknown[]) => void) => void;
  invoke: <T = unknown>(methodName: string, ...args: unknown[]) => Promise<T>;
  send: (methodName: string, ...args: unknown[]) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export interface SocketProviderProps {
  children: ReactNode;
  hubUrl?: string;
  autoConnect?: boolean;
  /**
   * When true, autoConnect will verify that an access token exists before
   * establishing a WebSocket connection. If no token exists, the connection stays
   * idle in Disconnected state without spamming 401 handshake errors.
   */
  requireAuth?: boolean;
  accessTokenFactory?: () => string | Promise<string>;
  authClient?: typeof authClient;
}

export function SocketProvider({
  children,
  hubUrl,
  autoConnect = true,
  requireAuth = false,
  accessTokenFactory,
  authClient: injectedAuthClient,
}: SocketProviderProps) {
  const isInitialMount = useRef(true);

  // Resolve token factory: prioritize injected auth client if provided
  const resolvedTokenFactory = useMemo(() => {
    if (injectedAuthClient) {
      return () => getSocketAccessToken(injectedAuthClient);
    }
    return accessTokenFactory || getSocketAccessToken;
  }, [injectedAuthClient, accessTokenFactory]);

  // Initialize connection lazily on initial client render
  const [connection, setConnection] = useState<HubConnection | null>(() => {
    if (typeof window === "undefined") return null;
    return buildSignalRConnection({
      hubUrl,
      accessTokenFactory: resolvedTokenFactory,
    });
  });

  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    connection ? connection.state : HubConnectionState.Disconnected
  );
  const [error, setError] = useState<Error | null>(null);

  // Handle dynamic prop changes after initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const newConnection = buildSignalRConnection({
      hubUrl,
      accessTokenFactory: resolvedTokenFactory,
    });
    setConnection(newConnection);
    setConnectionState(newConnection.state);

    return () => {
      newConnection.stop().catch(() => {});
    };
  }, [hubUrl, resolvedTokenFactory]);

  const isConnected = connectionState === HubConnectionState.Connected;
  const isConnecting =
    connectionState === HubConnectionState.Connecting ||
    connectionState === HubConnectionState.Reconnecting;
  const isReconnecting = connectionState === HubConnectionState.Reconnecting;

  const connect = useCallback(async () => {
    if (!connection) return;

    if (
      connection.state === HubConnectionState.Connecting ||
      connection.state === HubConnectionState.Connected
    ) {
      return;
    }

    // Await any pending disconnection transition before starting
    while (connection.state === HubConnectionState.Disconnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (connection.state === HubConnectionState.Disconnected) {
      setConnectionState(HubConnectionState.Connecting);
      setError(null);
      try {
        await connection.start();
        setConnectionState(HubConnectionState.Connected);
      } catch (err: unknown) {
        setConnectionState(HubConnectionState.Disconnected);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [connection]);

  const disconnect = useCallback(async () => {
    if (!connection) return;

    if (connection.state !== HubConnectionState.Disconnected) {
      try {
        await connection.stop();
      } catch {
        // Ignored during intentional disconnection
      } finally {
        setConnectionState(HubConnectionState.Disconnected);
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [connection]);

  const on = useCallback(
    (eventName: string, handler: (...args: unknown[]) => void) => {
      if (connection) {
        connection.on(eventName, handler);
      }
      return () => {
        connection?.off(eventName, handler);
      };
    },
    [connection]
  );

  const off = useCallback(
    (eventName: string, handler?: (...args: unknown[]) => void) => {
      if (connection) {
        if (handler) {
          connection.off(eventName, handler);
        } else {
          connection.off(eventName);
        }
      }
    },
    [connection]
  );

  const invoke = useCallback(
    async <T = unknown,>(methodName: string, ...args: unknown[]): Promise<T> => {
      if (!connection || connection.state !== HubConnectionState.Connected) {
        throw new Error(
          `Cannot invoke '${methodName}' because SignalR is not connected (current state: ${connection?.state ?? "null"}).`
        );
      }
      return connection.invoke<T>(methodName, ...args);
    },
    [connection]
  );

  const send = useCallback(
    async (methodName: string, ...args: unknown[]): Promise<void> => {
      if (!connection || connection.state !== HubConnectionState.Connected) {
        throw new Error(
          `Cannot send '${methodName}' because SignalR is not connected.`
        );
      }
      return connection.send(methodName, ...args);
    },
    [connection]
  );

  useEffect(() => {
    if (!connection) return;

    let isMounted = true;

    const handleReconnecting = (err?: Error) => {
      if (!isMounted) return;
      setConnectionState(HubConnectionState.Reconnecting);
      if (err) setError(err);
    };

    const handleReconnected = () => {
      if (!isMounted) return;
      setConnectionState(HubConnectionState.Connected);
      setError(null);
    };

    const handleClose = (err?: Error) => {
      if (!isMounted) return;
      setConnectionState(HubConnectionState.Disconnected);
      setError(err ?? null);
    };

    connection.onreconnecting(handleReconnecting);
    connection.onreconnected(handleReconnected);
    connection.onclose(handleClose);

    if (autoConnect) {
      void (async () => {
        // If auth is required, verify token availability first
        if (requireAuth) {
          try {
            const token = await resolvedTokenFactory();
            if (!isMounted) return;
            if (!token) {
              setConnectionState(HubConnectionState.Disconnected);
              return;
            }
          } catch {
            if (!isMounted) return;
            setConnectionState(HubConnectionState.Disconnected);
            return;
          }
        }

        // Wait if connection is currently in a transitional state (e.g. from React Strict Mode cleanup)
        while (
          connection.state === HubConnectionState.Disconnecting ||
          connection.state === HubConnectionState.Connecting
        ) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          if (!isMounted) return;
        }

        if (connection.state === HubConnectionState.Disconnected) {
          setConnectionState(HubConnectionState.Connecting);
          setError(null);
          try {
            await connection.start();
            if (!isMounted) {
              await connection.stop().catch(() => {});
              return;
            }
            setConnectionState(HubConnectionState.Connected);
          } catch (err: unknown) {
            if (!isMounted) return;
            setConnectionState(HubConnectionState.Disconnected);
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        } else if (connection.state === HubConnectionState.Connected) {
          setConnectionState(HubConnectionState.Connected);
        }
      })();
    }

    return () => {
      isMounted = false;
      if (
        connection.state === HubConnectionState.Connected ||
        connection.state === HubConnectionState.Connecting
      ) {
        connection.stop().catch(() => {});
      }
    };
  }, [connection, autoConnect, requireAuth, resolvedTokenFactory]);

  const value = useMemo<SocketContextType>(
    () => ({
      connection,
      isConnected,
      isConnecting,
      isReconnecting,
      connectionState,
      error,
      connect,
      disconnect,
      on,
      off,
      invoke,
      send,
    }),
    [
      connection,
      isConnected,
      isConnecting,
      isReconnecting,
      connectionState,
      error,
      connect,
      disconnect,
      on,
      off,
      invoke,
      send,
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a <SocketProvider>");
  }
  return context;
}

export default SocketProvider;
