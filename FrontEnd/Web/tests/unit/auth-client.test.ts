import { describe, it, expect } from "@jest/globals";
import { authClient, useSession, getSession, signIn, signUp, signOut } from "@/lib/auth-client";

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
    expect(signIn).toBeDefined();
    expect(signUp).toBeDefined();
    expect(signOut).toBeDefined();
  });

  it("exposes token retrieval capability from jwtClient plugin", () => {
    // jwtClient adds the token method/endpoint to the client
    expect((authClient as unknown as { token?: unknown }).token).toBeDefined();
  });

  it("exposes phone number authentication methods from phoneNumberClient plugin", () => {
    // phoneNumberClient adds phoneNumber methods to signIn
    expect(signIn).toBeDefined();
    const phoneSignIn = (signIn as unknown as { phoneNumber?: unknown }).phoneNumber;
    expect(phoneSignIn).toBeDefined();
  });
});
