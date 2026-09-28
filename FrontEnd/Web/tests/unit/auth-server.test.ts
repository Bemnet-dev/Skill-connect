/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  auth,
  AUTH_CONFIG,
  memoryStore,
  setSmsDispatcher,
  resolveAuthSecret,
  resolveTrustedOrigins,
  normalizePhoneForTempEmail,
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

  describe("Security: resolveAuthSecret()", () => {
    it("returns BETTER_AUTH_SECRET from centralized validated env", () => {
      const secret = resolveAuthSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe("Security: resolveTrustedOrigins()", () => {
    it("includes frontend web localhost development ports in non-production", () => {
      const origins = resolveTrustedOrigins();

      expect(origins).toContain("http://localhost:3000");
    });

    it("strictly excludes backend C# API port 5001 from browser CSRF trusted origins", () => {
      const origins = resolveTrustedOrigins();

      expect(origins).not.toContain("http://localhost:5001");
      expect(origins).not.toContain("https://localhost:5001");
    });
  });

  describe("Security: Rate Limiting & JWT Consistency", () => {
    it("ensures JWT issuer is 'skill-connect' by default without fallback to BETTER_AUTH_URL", () => {
      expect(AUTH_CONFIG.jwt.issuer).toBe("skill-connect");
    });

    it("configures rate limiting rules for OTP send and verify endpoints", () => {
      const options = auth.options as unknown as {
        rateLimit?: {
          enabled?: boolean;
          customRules?: Record<string, { window: number; max: number }>;
        };
      };

      expect(options.rateLimit).toBeDefined();
      expect(options.rateLimit?.customRules).toBeDefined();
      expect(options.rateLimit?.customRules?.["/api/auth/phone-number/send-otp"]).toEqual({
        window: 60,
        max: 3,
      });
      expect(options.rateLimit?.customRules?.["/api/auth/phone-number/verify"]).toEqual({
        window: 60,
        max: 5,
      });
    });
  });

  describe("Phone Verification: normalizePhoneForTempEmail()", () => {
    it("normalizes Ethiopian local 09... and +2519... to identical digit string", () => {
      const local = normalizePhoneForTempEmail("0911234567");
      const international = normalizePhoneForTempEmail("+251911234567");
      const short = normalizePhoneForTempEmail("911234567");

      expect(local).toBe("251911234567");
      expect(international).toBe("251911234567");
      expect(short).toBe("251911234567");
      expect(local).toBe(international);
    });

    it("strips formatting characters and preserves international numbers", () => {
      expect(normalizePhoneForTempEmail("+1 (415) 555-2671")).toBe("14155552671");
    });
  });
});

