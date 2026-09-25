"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
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
 * Allows overriding or mocking the Better Auth client instance for SocketProvider
 */
export function setBetterAuthClient(client: typeof authClient): void {
  activeAuthClient = client;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Auth Token Factory for SignalR
 * ─────────────────────────────────────────────────────────────────────────────
 * Pulls the current JWT directly from Better Auth's client instead of authStore.
 * Better Auth manages session refresh and token minting internally.
 */
export async function getSocketAccessToken(): Promise<string> {
  try {
    const { data, error } = await activeAuthClient.token();
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
  accessTokenFactory?: () => string | Promise<string>;
}

export function SocketProvider({
  children,
  hubUrl,
  autoConnect = true,
  accessTokenFactory = getSocketAccessToken,
}: SocketProviderProps) {
  // Initialize connection lazily without synchronous setState in effect
  const [connection] = useState<HubConnection | null>(() => {
    if (typeof window === "undefined") return null;
    return buildSignalRConnection({
      hubUrl,
      accessTokenFactory,
    });
  });

  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    connection ? connection.state : HubConnectionState.Disconnected
  );
  const [error, setError] = useState<Error | null>(null);

  const isConnected = connectionState === HubConnectionState.Connected;
  const isConnecting =
    connectionState === HubConnectionState.Connecting ||
    connectionState === HubConnectionState.Reconnecting;

  const connect = useCallback(async () => {
    if (!connection) return;

    if (connection.state === HubConnectionState.Disconnected) {
      setConnectionState(HubConnectionState.Connecting);
      try {
        await connection.start();
        setConnectionState(HubConnectionState.Connected);
        setError(null);
      } catch (err: unknown) {
        setConnectionState(HubConnectionState.Disconnected);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [connection]);

  const disconnect = useCallback(async () => {
    if (connection && connection.state !== HubConnectionState.Disconnected) {
      try {
        await connection.stop();
      } catch {
        // Ignored during disconnection
      } finally {
        setConnectionState(HubConnectionState.Disconnected);
      }
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

    connection.onreconnecting((err) => {
      if (!isMounted) return;
      setConnectionState(HubConnectionState.Reconnecting);
      if (err) setError(err);
    });

    connection.onreconnected(() => {
      if (!isMounted) return;
      setConnectionState(HubConnectionState.Connected);
      setError(null);
    });

    connection.onclose((err) => {
      if (!isMounted) return;
      setConnectionState(HubConnectionState.Disconnected);
      if (err) setError(err);
    });

    if (autoConnect && connection.state === HubConnectionState.Disconnected) {
      Promise.resolve()
        .then(() => {
          if (!isMounted) return;
          setConnectionState(HubConnectionState.Connecting);
          return connection.start();
        })
        .then(() => {
          if (!isMounted) return;
          setConnectionState(HubConnectionState.Connected);
          setError(null);
        })
        .catch((err: unknown) => {
          if (!isMounted) return;
          setConnectionState(HubConnectionState.Disconnected);
          setError(err instanceof Error ? err : new Error(String(err)));
        });
    }

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
    };
  }, [connection, autoConnect]);

  const value = useMemo<SocketContextType>(
    () => ({
      connection,
      isConnected,
      isConnecting,
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
