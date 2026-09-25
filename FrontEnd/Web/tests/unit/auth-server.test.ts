/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  auth,
  AUTH_CONFIG,
  memoryStore,
  setSmsDispatcher,
  type Session,
  type User,
} from "@/lib/auth-server";

describe("Better Auth Server (src/lib/auth-server.ts)", () => {
  beforeEach(() => {
    setSmsDispatcher(null);
    // Clear in-memory store between tests
    Object.keys(memoryStore).forEach((key) => {
      delete memoryStore[key];
    });
  });

  it("exports an initialized Better Auth instance with handler and api", () => {
    expect(auth).toBeDefined();
    expect(auth.handler).toBeDefined();
    expect(typeof auth.handler).toBe("function");
    expect(auth.api).toBeDefined();
    expect(typeof auth.api).toBe("object");
  });

  it("defines AUTH_CONFIG with expected JWT and phone settings", () => {
    expect(AUTH_CONFIG.jwt.expirationTime).toBe("15m");
    expect(AUTH_CONFIG.jwt.audience).toBe("skill-connect-api");
    expect(AUTH_CONFIG.jwt.issuer).toBeDefined();

    expect(AUTH_CONFIG.phone.otpLength).toBe(6);
    expect(AUTH_CONFIG.phone.expiresIn).toBe(300);
  });

  it("registers phoneNumber plugin endpoints on auth.api", () => {
    const api = auth.api as Record<string, unknown>;
    expect(api.signInPhoneNumber).toBeDefined();
    expect(api.sendPhoneNumberOTP).toBeDefined();
    expect(api.verifyPhoneNumber).toBeDefined();
  });

  it("registers JWT plugin endpoints on auth.api", () => {
    const api = auth.api as Record<string, unknown>;
    expect(api.getToken).toBeDefined();
    expect(api.signJWT).toBeDefined();
    expect(api.verifyJWT).toBeDefined();
    expect(api.getJwks).toBeDefined();
  });

  it("allows setting a custom SMS dispatcher hook for OTP delivery", async () => {
    const mockDispatcher = jest.fn<({ phoneNumber, code }: { phoneNumber: string; code: string }) => Promise<void>>();
    mockDispatcher.mockResolvedValue(undefined);

    setSmsDispatcher(mockDispatcher);

    // Call sendPhoneNumberOTP endpoint
    await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber: "+15551234567",
      },
    });

    expect(mockDispatcher).toHaveBeenCalledTimes(1);
    const callArg = mockDispatcher.mock.calls[0][0];
    expect(callArg.phoneNumber).toBe("+15551234567");
    expect(callArg.code).toHaveLength(6);
  });

  it("provides TypeScript types for Session and User", () => {
    // Compile-time check asserting Session and User types are usable
    const dummyUser: Partial<User> = {
      id: "u-123",
      email: "test@example.com",
    };
    const dummySession: Partial<Session> = {
      session: {
        id: "s-123",
        userId: "u-123",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "tok-123",
      },
      user: dummyUser as User,
    };
    expect(dummyUser.id).toBe("u-123");
    expect(dummySession.session?.userId).toBe("u-123");
  });
});
