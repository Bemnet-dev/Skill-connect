/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import {
  phoneSchema,
  phoneInputSchema,
  otpSchema,
  createOtpSchema,
  moneySchema,
  moneyInputSchema,
  currencyCodeSchema,
  monetaryValueSchema,
  geoPointSchema,
  geoTupleSchema,
} from "@/lib/validation/primitives";

describe("Validation Primitives (Single Source of Truth)", () => {
  describe("phoneSchema", () => {
    it("accepts valid international E.164 phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "+251911234567",
        "+447911123456",
        "+919876543210",
        "+49301234567",
      ];

      validPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid phone numbers", () => {
      const invalidPhones = [
        "1234567890", // Missing +
        "+0123456789", // Country code starts with 0
        "+12345abcde", // Letters
        "+", // Just plus
        "", // Empty
        "   ", // Whitespace only
        "+1234567890123456", // More than 15 digits
      ];

      invalidPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });

    it("phoneInputSchema cleans spaces and hyphens before validating", () => {
      const formatted = "+1 (234) 567-8901";
      const result = phoneInputSchema.safeParse(formatted);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("+12345678901");
      }
    });
  });

  describe("otpSchema", () => {
    it("accepts exact 6-digit numeric strings", () => {
      const validCodes = ["123456", "000000", "999999", "054321"];

      validCodes.forEach((code) => {
        const result = otpSchema.safeParse(code);
        expect(result.success).toBe(true);
      });
    });

    it("rejects non-6-digit or non-numeric codes", () => {
      const invalidCodes = [
        "12345", // 5 digits
        "1234567", // 7 digits
        "abcdef", // Letters
        "12345a", // Mixed
        "12 456", // Space
        "", // Empty
      ];

      invalidCodes.forEach((code) => {
        const result = otpSchema.safeParse(code);
        expect(result.success).toBe(false);
      });
    });

    it("createOtpSchema supports custom length OTP codes", () => {
      const otp4 = createOtpSchema(4);
      expect(otp4.safeParse("1234").success).toBe(true);
      expect(otp4.safeParse("12345").success).toBe(false);

      const otp8 = createOtpSchema(8);
      expect(otp8.safeParse("12345678").success).toBe(true);
      expect(otp8.safeParse("1234567").success).toBe(false);
    });
  });

  describe("moneySchema", () => {
    it("accepts non-negative amounts with at most 2 decimal places", () => {
      const validAmounts = [0, 10, 25.5, 99.99, 1500, 1000000];

      validAmounts.forEach((amount) => {
        const result = moneySchema.safeParse(amount);
        expect(result.success).toBe(true);
      });
    });

    it("rejects negative amounts, excessive decimals, or values exceeding max", () => {
      const invalidAmounts = [
        -1, // Negative
        -0.01, // Negative fraction
        12.345, // 3 decimal places
        0.001, // 3 decimal places
        10_000_001, // Exceeds upper limit
        NaN,
        Infinity,
      ];

      invalidAmounts.forEach((amount) => {
        const result = moneySchema.safeParse(amount);
        expect(result.success).toBe(false);
      });
    });

    it("moneyInputSchema coerces valid string numbers and formatted amounts", () => {
      expect(moneyInputSchema.parse("50")).toBe(50);
      expect(moneyInputSchema.parse("12.50")).toBe(12.5);
      expect(moneyInputSchema.parse("1,250.75")).toBe(1250.75);
      expect(moneyInputSchema.safeParse("not-a-number").success).toBe(false);
    });

    it("monetaryValueSchema validates amount and 3-letter currency code", () => {
      const validValue = { amount: 150.5, currency: "USD" };
      expect(monetaryValueSchema.safeParse(validValue).success).toBe(true);

      const invalidCurrency = { amount: 150.5, currency: "US" };
      expect(monetaryValueSchema.safeParse(invalidCurrency).success).toBe(false);

      const defaultCurrency = currencyCodeSchema.parse(undefined);
      expect(defaultCurrency).toBe("USD");
    });
  });

  describe("geoPointSchema", () => {
    it("accepts valid GPS latitude and longitude coordinates", () => {
      const validPoints = [
        { latitude: 0, longitude: 0 },
        { latitude: 9.03, longitude: 38.74 }, // Addis Ababa
        { latitude: 40.7128, longitude: -74.006 }, // New York
        { latitude: -90, longitude: -180 }, // Lower bounds
        { latitude: 90, longitude: 180 }, // Upper bounds
        {
          latitude: 37.7749,
          longitude: -122.4194,
          address: "Market St",
          city: "San Francisco",
        },
      ];

      validPoints.forEach((point) => {
        const result = geoPointSchema.safeParse(point);
        expect(result.success).toBe(true);
      });
    });

    it("rejects coordinates outside valid latitude and longitude bounds", () => {
      const invalidPoints = [
        { latitude: 90.1, longitude: 0 }, // Latitude > 90
        { latitude: -90.1, longitude: 0 }, // Latitude < -90
        { latitude: 0, longitude: 180.1 }, // Longitude > 180
        { latitude: 0, longitude: -180.1 }, // Longitude < -180
        { latitude: "40", longitude: -74 }, // Strings instead of numbers
        { latitude: 40 }, // Missing longitude
      ];

      invalidPoints.forEach((point) => {
        const result = geoPointSchema.safeParse(point);
        expect(result.success).toBe(false);
      });
    });

    it("geoTupleSchema accepts [longitude, latitude] GeoJSON tuple", () => {
      expect(geoTupleSchema.safeParse([38.74, 9.03]).success).toBe(true);
      // Longitude > 180
      expect(geoTupleSchema.safeParse([185, 9.03]).success).toBe(false);
      // Latitude > 90
      expect(geoTupleSchema.safeParse([38.74, 95]).success).toBe(false);
    });
  });
});
