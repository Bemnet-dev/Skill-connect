import React from "react";
import { render, renderHook, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  SocketProvider,
  useSocket,
  getSocketAccessToken,
  setBetterAuthClient,
} from "@/state/context/SocketProvider";

describe("SocketProvider & Better Auth SignalR accessTokenFactory", () => {
  const mockToken = jest.fn<() => Promise<{ data: { token: string } | null; error: unknown }>>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockToken.mockReset();
    setBetterAuthClient({
      token: mockToken,
    } as never);
  });

  describe("getSocketAccessToken", () => {
    it("pulls current JWT from Better Auth's client instead of authStore.accessToken", async () => {
      mockToken.mockResolvedValueOnce({
        data: { token: "signalr-better-auth-jwt-999" },
        error: null,
      });

      const token = await getSocketAccessToken();

      expect(token).toBe("signalr-better-auth-jwt-999");
      expect(mockToken).toHaveBeenCalledTimes(1);
    });

    it("returns empty string when Better Auth client returns no token or error", async () => {
      mockToken.mockResolvedValueOnce({
        data: null,
        error: { status: 401, message: "Unauthenticated" },
      });

      const token = await getSocketAccessToken();

      expect(token).toBe("");
      expect(mockToken).toHaveBeenCalledTimes(1);
    });

    it("returns empty string if Better Auth client rejects with exception", async () => {
      mockToken.mockRejectedValueOnce(new Error("Network failed"));

      const token = await getSocketAccessToken();

      expect(token).toBe("");
    });

    it("accepts an explicit authClient parameter without relying on global state", async () => {
      const customClient = {
        token: jest.fn<() => Promise<{ data: { token: string } | null; error: unknown }>>().mockResolvedValueOnce({
          data: { token: "injected-client-token" },
          error: null,
        }),
      };

      const token = await getSocketAccessToken(customClient as never);
      expect(token).toBe("injected-client-token");
      expect(customClient.token).toHaveBeenCalledTimes(1);
    });
  });

  describe("SocketProvider Component & useSocket Hook", () => {
    it("throws an error when useSocket is used outside of SocketProvider", () => {
      // Suppress console.error for expected thrown error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => renderHook(() => useSocket())).toThrow(
        "useSocket must be used within a <SocketProvider>"
      );

      consoleSpy.mockRestore();
    });

    it("renders children and provides context values inside SocketProvider", () => {
      render(
        <SocketProvider autoConnect={false}>
          <div data-testid="child-element">Child Content</div>
        </SocketProvider>
      );

      expect(screen.getByTestId("child-element")).toHaveTextContent("Child Content");
    });

    it("provides connection and helper methods to consumers with isReconnecting state", () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={false}>{children}</SocketProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.connect).toBe("function");
      expect(typeof result.current.disconnect).toBe("function");
      expect(typeof result.current.on).toBe("function");
      expect(typeof result.current.off).toBe("function");
      expect(typeof result.current.invoke).toBe("function");
      expect(typeof result.current.send).toBe("function");
    });

    it("does not initiate autoConnect when requireAuth is true and token is empty", async () => {
      mockToken.mockResolvedValueOnce({
        data: null,
        error: { status: 401, message: "Unauthenticated" },
      });

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={true} requireAuth={true}>
            {children}
          </SocketProvider>
        ),
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("clears error state when disconnect() is called", async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={false}>{children}</SocketProvider>
        ),
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.error).toBeNull();
    });

    it("throws clear error when invoke is called while disconnected", async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={false}>{children}</SocketProvider>
        ),
      });

      await expect(result.current.invoke("SendMessage", "hello")).rejects.toThrow(
        "Cannot invoke 'SendMessage' because SignalR is not connected"
      );
    });

    it("throws clear error when send is called while disconnected", async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={false}>{children}</SocketProvider>
        ),
      });

      await expect(result.current.send("SendMessage", "hello")).rejects.toThrow(
        "Cannot send 'SendMessage' because SignalR is not connected"
      );
    });

    it("registers and unregisters event handlers via on() and off()", () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={false}>{children}</SocketProvider>
        ),
      });

      const handler = jest.fn();
      let unsubscribe: () => void = () => {};

      expect(() => {
        act(() => {
          unsubscribe = result.current.on("ReceiveNotification", handler);
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          unsubscribe();
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.off("ReceiveNotification", handler);
          result.current.off("ReceiveNotification");
        });
      }).not.toThrow();
    });

    it("supports injecting authClient directly via provider props", () => {
      const injectedMockToken = jest.fn<() => Promise<{ data: { token: string } | null; error: unknown }>>().mockResolvedValue({
        data: { token: "prop-injected-token-555" },
        error: null,
      });

      const customAuthClient = {
        token: injectedMockToken,
      };

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider
            autoConnect={false}
            authClient={customAuthClient as never}
          >
            {children}
          </SocketProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.isConnected).toBe(false);
    });
  });
});
