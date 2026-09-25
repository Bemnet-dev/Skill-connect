/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { requestOtp, verifyOtp, logout } from "@/features/auth/api";
import { apiClient, getAuthToken, setAuthToken, clearAuthTokens } from "@/lib/api-client";
import { ZodError } from "zod";

describe("Auth Feature API Client (src/features/auth/api.ts)", () => {
  beforeEach(() => {
    clearAuthTokens();
    jest.clearAllMocks();
  });

  describe("requestOtp()", () => {
    it("validates phone and calls apiClient.post to send-otp endpoint", async () => {
      const postSpy = jest
        .spyOn(apiClient, "post")
        .mockResolvedValueOnce({ success: true, message: "Code sent" });

      const result = await requestOtp({ phone: "+251911234567" });

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/phone-number/send-otp",
        { phoneNumber: "+251911234567" },
        undefined
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe("Code sent");
    });

    it("accepts string phone number and normalizes formatting characters", async () => {
      const postSpy = jest
        .spyOn(apiClient, "post")
        .mockResolvedValueOnce({ success: true });

      const result = await requestOtp("+1 (415) 555-2671");

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/phone-number/send-otp",
        { phoneNumber: "+14155552671" },
        undefined
      );
      expect(result.success).toBe(true);
    });

    it("rejects invalid phone numbers before making an API request", async () => {
      const postSpy = jest.spyOn(apiClient, "post");

      await expect(requestOtp({ phone: "invalid-phone" })).rejects.toThrow(
        ZodError
      );
      expect(postSpy).not.toHaveBeenCalled();
    });

    it("passes custom request options to apiClient", async () => {
      const postSpy = jest
        .spyOn(apiClient, "post")
        .mockResolvedValueOnce({ success: true });

      await requestOtp("+251911234567", { timeout: 3000 });

      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/phone-number/send-otp",
        { phoneNumber: "+251911234567" },
        { timeout: 3000 }
      );
    });
  });

  describe("verifyOtp()", () => {
    it("validates input, posts to sign-in endpoint, and parses response through sessionSchema", async () => {
      const mockBackendResponse = {
        user: {
          id: "usr_abc123",
          phone: "+251911234567",
          role: "customer",
          name: "Test User",
        },
        session: {
          id: "sess_xyz789",
          userId: "usr_abc123",
          token: "jwt_session_token",
          expiresAt: "2026-10-01T00:00:00.000Z",
        },
        token: "bearer_api_jwt_token",
      };

      const postSpy = jest
        .spyOn(apiClient, "post")
        .mockResolvedValueOnce(mockBackendResponse);

      const session = await verifyOtp({
        phone: "+251911234567",
        code: "123456",
      });

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/sign-in/phone-number",
        {
          phoneNumber: "+251911234567",
          code: "123456",
        },
        undefined
      );

      expect(session.user.id).toBe("usr_abc123");
      expect(session.user.role).toBe("customer");
      expect(session.session?.id).toBe("sess_xyz789");
      expect(session.token).toBe("bearer_api_jwt_token");

      // Verifies token was automatically stored
      expect(getAuthToken()).toBe("bearer_api_jwt_token");
    });

    it("unwraps data envelope if backend nests response inside data property", async () => {
      const envelopedResponse = {
        data: {
          user: {
            id: "usr_enveloped",
            phone: "+251911234567",
            role: "worker",
          },
          token: "enveloped_token",
        },
      };

      jest.spyOn(apiClient, "post").mockResolvedValueOnce(envelopedResponse);

      const session = await verifyOtp({
        phone: "+251911234567",
        code: "654321",
      });

      expect(session.user.id).toBe("usr_enveloped");
      expect(session.user.role).toBe("worker");
      expect(getAuthToken()).toBe("enveloped_token");
    });

    it("rejects invalid 5-digit code without calling API", async () => {
      const postSpy = jest.spyOn(apiClient, "post");

      await expect(
        verifyOtp({
          phone: "+251911234567",
          code: "12345",
        })
      ).rejects.toThrow(ZodError);

      expect(postSpy).not.toHaveBeenCalled();
    });

    it("throws if backend response fails sessionSchema validation", async () => {
      // Backend returned unexpected structure missing user.id
      const malformedResponse = {
        status: "ok",
        // missing required user object
      };

      jest.spyOn(apiClient, "post").mockResolvedValueOnce(malformedResponse);

      await expect(
        verifyOtp({
          phone: "+251911234567",
          code: "123456",
        })
      ).rejects.toThrow(ZodError);
    });
  });

  describe("logout()", () => {
    it("calls sign-out endpoint and clears auth tokens", async () => {
      setAuthToken("sample_active_token");
      expect(getAuthToken()).toBe("sample_active_token");

      const postSpy = jest
        .spyOn(apiClient, "post")
        .mockResolvedValueOnce({ success: true });

      await logout();

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        "/api/auth/sign-out",
        undefined,
        undefined
      );
      expect(getAuthToken()).toBeNull();
    });

    it("clears auth tokens even if the server request fails", async () => {
      setAuthToken("sample_active_token");

      jest.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Server error"));

      await expect(logout()).rejects.toThrow("Server error");
      // Tokens must still be cleared in finally block
      expect(getAuthToken()).toBeNull();
    });
  });
});
