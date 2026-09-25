/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import {
  loginSchema,
  verifyOtpSchema,
  sessionSchema,
  userSchema,
  sessionInfoSchema,
} from "@/features/auth/schema";

describe("Auth Feature Schemas (src/features/auth/schema.ts)", () => {
  describe("loginSchema (phone only)", () => {
    it("validates valid international E.164 phone numbers", () => {
      const validPayloads = [
        { phone: "+251911234567" },
        { phone: "+14155552671" },
        { phone: "+447911123456" },
      ];

      validPayloads.forEach((payload) => {
        const result = loginSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it("cleans and normalizes formatting characters (spaces, hyphens, parens)", () => {
      const formatted = { phone: "+1 (415) 555-2671" };
      const result = loginSchema.safeParse(formatted);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("+14155552671");
      }
    });

    it("rejects missing, empty, or invalid phone numbers", () => {
      const invalidPayloads = [
        {},
        { phone: "" },
        { phone: "not-a-number" },
        { phone: "123456" }, // Missing country code prefix
        { phone: "+0123456789" }, // Country code starting with 0
      ];

      invalidPayloads.forEach((payload) => {
        const result = loginSchema.safeParse(payload);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("verifyOtpSchema (phone + code)", () => {
    it("validates valid phone and 6-digit OTP code", () => {
      const payload = {
        phone: "+251911234567",
        code: "654321",
      };

      const result = verifyOtpSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("+251911234567");
        expect(result.data.code).toBe("654321");
      }
    });

    it("cleans whitespace inside the OTP code", () => {
      const payload = {
        phone: "+1 (415) 555-2671",
        code: "123 456",
      };

      const result = verifyOtpSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("+14155552671");
        expect(result.data.code).toBe("123456");
      }
    });

    it("rejects codes that are not exactly 6 digits", () => {
      const invalidCodes = ["12345", "1234567", "abcdef", "", "12345a"];

      invalidCodes.forEach((code) => {
        const result = verifyOtpSchema.safeParse({
          phone: "+251911234567",
          code,
        });
        expect(result.success).toBe(false);
      });
    });

    it("rejects payload missing phone or code", () => {
      expect(verifyOtpSchema.safeParse({ phone: "+251911234567" }).success).toBe(
        false
      );
      expect(verifyOtpSchema.safeParse({ code: "123456" }).success).toBe(false);
    });
  });

  describe("sessionSchema (what the backend returns on success)", () => {
    it("validates complete backend session response with user, session, and token", () => {
      const payload = {
        user: {
          id: "usr_123456",
          phone: "+251911234567",
          phoneNumber: "+251911234567",
          role: "customer",
          name: "Abebe Bikila",
          email: "abebe@example.com",
          avatarUrl: "https://example.com/avatar.jpg",
          isVerified: true,
          onboardingCompleted: true,
          createdAt: "2026-09-25T12:00:00.000Z",
        },
        session: {
          id: "sess_789012",
          userId: "usr_123456",
          token: "jwt_session_token_example",
          expiresAt: "2026-10-25T12:00:00.000Z",
          createdAt: "2026-09-25T12:00:00.000Z",
        },
        token: "jwt_bearer_token_for_api",
        refreshToken: "rt_example_token",
      };

      const result = sessionSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe("usr_123456");
        expect(result.data.user.role).toBe("customer");
        expect(result.data.session?.id).toBe("sess_789012");
        expect(result.data.token).toBe("jwt_bearer_token_for_api");
      }
    });

    it("defaults user role to 'customer' when omitted", () => {
      const payload = {
        user: {
          id: "usr_default_role",
          phone: "+251911234567",
        },
      };

      const result = sessionSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.role).toBe("customer");
      }
    });

    it("validates valid roles ('customer', 'worker', 'admin')", () => {
      const roles = ["customer", "worker", "admin"] as const;

      roles.forEach((role) => {
        const result = userSchema.safeParse({
          id: `usr_${role}`,
          role,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe(role);
        }
      });
    });

    it("rejects unauthorized role values", () => {
      const result = userSchema.safeParse({
        id: "usr_invalid",
        role: "super_moderator",
      });
      expect(result.success).toBe(false);
    });

    it("accepts Date instances for session expiry and timestamps", () => {
      const expiryDate = new Date(Date.now() + 3600000);
      const result = sessionInfoSchema.safeParse({
        id: "sess_date_test",
        userId: "usr_123",
        expiresAt: expiryDate,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toEqual(expiryDate);
      }
    });

    it("rejects session response missing user object", () => {
      const invalidPayload = {
        session: {
          id: "sess_orphan",
          userId: "usr_123",
          expiresAt: "2026-10-25T12:00:00.000Z",
        },
      };

      const result = sessionSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("passes through unknown backend custom claims without throwing", () => {
      const payloadWithExtras = {
        user: {
          id: "usr_extra",
          role: "worker",
          skills: ["plumbing", "electrical"],
          hourlyRate: 45,
          customMetadata: { score: 98 },
        },
        session: {
          id: "sess_extra",
          userId: "usr_extra",
          expiresAt: "2026-10-25T12:00:00.000Z",
          deviceFingerprint: "fp_xyz",
        },
      };

      const result = sessionSchema.safeParse(payloadWithExtras);
      expect(result.success).toBe(true);
      if (result.success) {
        const userObj = result.data.user as Record<string, unknown>;
        const sessionObj = result.data.session as Record<string, unknown>;
        expect(userObj.skills).toEqual([
          "plumbing",
          "electrical",
        ]);
        expect(sessionObj.deviceFingerprint).toBe("fp_xyz");
      }
    });
  });
});
