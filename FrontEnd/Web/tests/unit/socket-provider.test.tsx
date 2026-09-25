import React from "react";
import { render, renderHook, screen } from "@testing-library/react";
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

    it("provides connection and helper methods to consumers", () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <SocketProvider autoConnect={false}>{children}</SocketProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.isConnected).toBe(false);
      expect(typeof result.current.connect).toBe("function");
      expect(typeof result.current.disconnect).toBe("function");
      expect(typeof result.current.on).toBe("function");
      expect(typeof result.current.off).toBe("function");
      expect(typeof result.current.invoke).toBe("function");
    });
  });
});
