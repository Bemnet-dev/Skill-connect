import { describe, it, expect } from "@jest/globals";
import {
  // Schemas
  loginSchema,
  verifyOtpSchema,
  otpInputSchema,
  sessionSchema,
  userSchema,
  sessionInfoSchema,
  userRoleSchema,
  // API functions
  requestOtp,
  verifyOtp,
  logout,
  // Hooks
  useLogin,
  useVerifyOtp,
  useAuth,
  // Types (compile-time validation)
  type LoginInput,
  type VerifyOtpInput,
  type SessionResponse,
  type AuthUser,
  type SessionInfo,
  type UserRole,
  type RequestOtpResponse,
  type UseLoginOptions,
  type LoginVariables,
  type UseVerifyOtpOptions,
  type VerifyOtpVariables,
  type UseAuthReturn,
  type User,
  type Permission,
} from "@/features/auth";

describe("Auth Feature Barrel (src/features/auth/index.ts)", () => {
  describe("Schema Exports", () => {
    it("exports all canonical auth validation schemas", () => {
      expect(loginSchema).toBeDefined();
      expect(typeof loginSchema.parse).toBe("function");

      expect(verifyOtpSchema).toBeDefined();
      expect(typeof verifyOtpSchema.parse).toBe("function");

      expect(otpInputSchema).toBeDefined();
      expect(typeof otpInputSchema.parse).toBe("function");

      expect(sessionSchema).toBeDefined();
      expect(typeof sessionSchema.parse).toBe("function");

      expect(userSchema).toBeDefined();
      expect(typeof userSchema.parse).toBe("function");

      expect(sessionInfoSchema).toBeDefined();
      expect(typeof sessionInfoSchema.parse).toBe("function");

      expect(userRoleSchema).toBeDefined();
      expect(typeof userRoleSchema.parse).toBe("function");
    });

    it("correctly parses inputs through schemas imported from barrel", () => {
      const login = loginSchema.parse({ phone: "+251911223344" });
      expect(login.phone).toBe("+251911223344");

      const verify = verifyOtpSchema.parse({
        phone: "+251911223344",
        code: " 123 456 ",
      });
      expect(verify.code).toBe("123456");

      const session = sessionSchema.parse({
        user: { id: "usr_100", role: "customer" },
      });
      expect(session.user.id).toBe("usr_100");
    });
  });

  describe("API Client Exports", () => {
    it("exports all API request methods as callable functions", () => {
      expect(typeof requestOtp).toBe("function");
      expect(typeof verifyOtp).toBe("function");
      expect(typeof logout).toBe("function");
    });
  });

  describe("React Hook Exports", () => {
    it("exports all authentication TanStack and convenience hooks", () => {
      expect(typeof useLogin).toBe("function");
      expect(typeof useVerifyOtp).toBe("function");
      expect(typeof useAuth).toBe("function");
    });
  });

  describe("Type Definitions & Inferred Types", () => {
    it("provides compile-time types for inputs and returns", () => {
      const loginData: LoginInput = { phone: "+251911223344" };
      const verifyData: VerifyOtpInput = { phone: "+251911223344", code: "123456" };
      const userRole: UserRole = "worker";
      const permission: Permission = "worker:accept_job";

      const authUser: AuthUser = {
        id: "usr_1",
        role: userRole,
      };

      const user: User = {
        id: "usr_1",
        role: "worker",
      };

      const sessionInfo: SessionInfo = {
        id: "sess_1",
        userId: "usr_1",
        expiresAt: new Date(),
      };

      const sessionResp: SessionResponse = {
        user: authUser,
        session: sessionInfo,
      };

      const otpResp: RequestOtpResponse = {
        success: true,
        message: "Code sent",
      };

      const loginOpts: UseLoginOptions = {};
      const loginVars: LoginVariables = { phone: "+251911223344" };
      const verifyOpts: UseVerifyOtpOptions = {};
      const verifyVars: VerifyOtpVariables = { phone: "+251911223344", code: "123456" };
      const authReturn: Partial<UseAuthReturn> = { isAuthenticated: true, user };

      expect(loginData).toBeDefined();
      expect(verifyData).toBeDefined();
      expect(authUser).toBeDefined();
      expect(user).toBeDefined();
      expect(sessionInfo).toBeDefined();
      expect(sessionResp).toBeDefined();
      expect(otpResp).toBeDefined();
      expect(loginOpts).toBeDefined();
      expect(loginVars).toBeDefined();
      expect(verifyOpts).toBeDefined();
      expect(verifyVars).toBeDefined();
      expect(authReturn).toBeDefined();
      expect(permission).toBe("worker:accept_job");
    });
  });
});
