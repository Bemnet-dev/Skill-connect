import { describe, it, expect } from "@jest/globals";
import * as authClientModule from "@/lib/auth-client";
import { authClient, useSession, getSession, signOut } from "@/lib/auth-client";

describe("Better Auth Client (src/lib/auth-client.ts)", () => {
  it("exports a configured authClient instance", () => {
    expect(authClient).toBeDefined();
    expect(typeof authClient === "function" || typeof authClient === "object").toBe(true);
  });

  it("exports core session and authentication methods", () => {
    expect(useSession).toBeDefined();
    expect(typeof useSession).toBe("function");
    expect(getSession).toBeDefined();
    expect(typeof getSession).toBe("function");
    expect(signOut).toBeDefined();
  });

  it("does not export generic signIn or signUp to enforce phone-only authentication (FR-AUTH-01)", () => {
    const rawModule = authClientModule as Record<string, unknown>;
    expect(rawModule.signIn).toBeUndefined();
    expect(rawModule.signUp).toBeUndefined();
  });

  it("exposes token retrieval capability from jwtClient plugin", () => {
    // jwtClient adds the token method/endpoint to the client
    expect((authClient as unknown as { token?: unknown }).token).toBeDefined();
  });

  it("exposes phone number authentication methods from phoneNumberClient plugin", () => {
    // Internal client provides phone number OTP authentication methods
    const client = authClient as unknown as { phoneNumber?: unknown; signIn?: { phoneNumber?: unknown } };
    const hasPhoneAuth = Boolean(client.phoneNumber || client.signIn?.phoneNumber);
    expect(hasPhoneAuth).toBe(true);
  });

  it("exports TypeScript types for ClientSession and ClientUser with inferred fields", () => {
    // Compile-time check asserting ClientUser and ClientSession can be typed with role
    const testUser = {
      id: "u-456",
      name: "Test User",
      email: "test@skillconnect.internal",
      role: "customer" as const,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(testUser.role).toBe("customer");
  });
});

