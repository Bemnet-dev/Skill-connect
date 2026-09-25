/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import { env as rootEnv } from "@/env";
import { env as libEnv } from "@/lib/env";

describe("Environment Variable Validation (src/env.ts & src/lib/env.ts)", () => {
  it("exports a valid env object from @/env", () => {
    expect(rootEnv).toBeDefined();
    expect(typeof rootEnv).toBe("object");
  });

  it("exports an identical env object from @/lib/env for backwards compatibility", () => {
    expect(libEnv).toBeDefined();
    expect(libEnv).toBe(rootEnv);
  });

  describe("Better Auth Server Environment Variables", () => {
    it("provides BETTER_AUTH_SECRET with a valid fallback default", () => {
      expect(rootEnv.BETTER_AUTH_SECRET).toBeDefined();
      expect(typeof rootEnv.BETTER_AUTH_SECRET).toBe("string");
      expect(rootEnv.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(1);
    });

    it("provides BETTER_AUTH_URL as a valid URL string", () => {
      expect(rootEnv.BETTER_AUTH_URL).toBeDefined();
      expect(typeof rootEnv.BETTER_AUTH_URL).toBe("string");
      expect(() => new URL(rootEnv.BETTER_AUTH_URL)).not.toThrow();
    });

    it("provides AUTH_JWT_ISSUER, AUTH_JWT_AUDIENCE, and AUTH_JWT_EXPIRY", () => {
      expect(rootEnv.AUTH_JWT_ISSUER).toBeDefined();
      expect(typeof rootEnv.AUTH_JWT_ISSUER).toBe("string");

      expect(rootEnv.AUTH_JWT_AUDIENCE).toBeDefined();
      expect(typeof rootEnv.AUTH_JWT_AUDIENCE).toBe("string");

      expect(rootEnv.AUTH_JWT_EXPIRY).toBeDefined();
      expect(typeof rootEnv.AUTH_JWT_EXPIRY).toBe("string");
    });
  });

  describe("Client Public Environment Variables", () => {
    it("provides NEXT_PUBLIC_APP_URL as a valid URL", () => {
      expect(rootEnv.NEXT_PUBLIC_APP_URL).toBeDefined();
      expect(() => new URL(rootEnv.NEXT_PUBLIC_APP_URL)).not.toThrow();
    });

    it("provides NEXT_PUBLIC_API_BASE_URL as a valid URL", () => {
      expect(rootEnv.NEXT_PUBLIC_API_BASE_URL).toBeDefined();
      expect(() => new URL(rootEnv.NEXT_PUBLIC_API_BASE_URL)).not.toThrow();
    });

    it("provides NEXT_PUBLIC_SIGNALR_HUB_URL as a valid URL", () => {
      expect(rootEnv.NEXT_PUBLIC_SIGNALR_HUB_URL).toBeDefined();
      expect(() => new URL(rootEnv.NEXT_PUBLIC_SIGNALR_HUB_URL)).not.toThrow();
    });

    it("provides NEXT_PUBLIC_DEFAULT_LOCALE with default value 'en'", () => {
      expect(rootEnv.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("en");
    });
  });
});
