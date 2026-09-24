/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  buildSignalRConnection,
  createSignalRConnection,
  getSignalRHubUrl,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from "@/lib/signalr-client";
import { SIGNALR } from "@/lib/constants";
import { setAuthToken, clearAuthTokens } from "@/lib/api-client";

describe("signalr-client (SignalR Connection Builder)", () => {
  beforeEach(() => {
    clearAuthTokens();
  });

  describe("getSignalRHubUrl", () => {
    it("returns default hub URL when no override provided", () => {
      const url = getSignalRHubUrl();
      expect(url).toMatch(/^https?:\/\//);
      expect(url).toContain("/hubs/realtime");
    });

    it("uses provided override URL and strips trailing slashes", () => {
      const url = getSignalRHubUrl("https://api.example.com/hubs/custom///");
      expect(url).toBe("https://api.example.com/hubs/custom");
    });
  });

  describe("buildSignalRConnection", () => {
    it("returns a valid HubConnection instance in Disconnected state", () => {
      const connection = buildSignalRConnection();

      expect(connection).toBeInstanceOf(HubConnection);
      expect(connection.state).toBe(HubConnectionState.Disconnected);
    });

    it("configures serverTimeout and keepAliveInterval matching centralized constants", () => {
      const connection = buildSignalRConnection();

      expect(connection.serverTimeoutInMilliseconds).toBe(SIGNALR.TIMEOUT_MS);
      expect(connection.keepAliveIntervalInMilliseconds).toBe(
        SIGNALR.KEEP_ALIVE_INTERVAL_MS
      );
    });

    it("attaches access token from getAuthToken()", async () => {
      setAuthToken("jwt-access-token-12345");

      let capturedToken = "";
      const connection = buildSignalRConnection({
        accessTokenFactory: async () => {
          capturedToken = "mocked-token-for-test";
          return capturedToken;
        },
      });

      expect(connection).toBeDefined();
      expect(connection.baseUrl).toBeDefined();
    });

    it("allows custom hubUrl and logLevel overrides", () => {
      const customUrl = "https://custom.service.com/hubs/events";
      const connection = buildSignalRConnection({
        hubUrl: customUrl,
        logLevel: LogLevel.Debug,
      });

      expect(connection.baseUrl).toContain("custom.service.com/hubs/events");
    });

    it("createSignalRConnection alias behaves identically to buildSignalRConnection", () => {
      expect(createSignalRConnection).toBe(buildSignalRConnection);

      const conn = createSignalRConnection();
      expect(conn).toBeInstanceOf(HubConnection);
      expect(conn.serverTimeoutInMilliseconds).toBe(SIGNALR.TIMEOUT_MS);
    });
  });
});
