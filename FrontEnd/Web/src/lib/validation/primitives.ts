import { z } from "zod";
import { VALIDATION, PAGINATION } from "@/lib/constants";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Validation Primitives (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────────────────────
 * Every feature schema (auth, booking, chat, discovery, payments, quotation,
 * ratings, worker-profile) imports from here instead of redefining regex/rules.
 */

// ── 1. Phone Number Schema ──────────────────────────────────────────────────
/**
 * Validates international phone numbers in E.164 format (+[country code][number]).
 * Example: +1234567890, +251911234567
 */
export const phoneSchema = z
  .string({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a string",
  })
  .trim()
  .min(1, "Phone number is required")
  .regex(
    VALIDATION.PHONE_REGEX,
    "Invalid phone number format. Must be in E.164 international format (e.g. +1234567890)"
  );

/**
 * Coercive/flexible phone schema that trims spaces, hyphens, and parentheses
 */
export const phoneInputSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s\-()]/g, ""))
  .pipe(phoneSchema);

export type PhoneNumber = z.infer<typeof phoneSchema>;

// ── 2. OTP (One-Time Password) Schema ────────────────────────────────────────
/**
 * Standard 6-digit numeric verification code
 */
export const otpSchema = z
  .string({
    required_error: "OTP code is required",
    invalid_type_error: "OTP code must be a string",
  })
  .trim()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only numbers");

/**
 * Configurable OTP generator schema for variable length verification codes (e.g. 4 or 6 digits)
 */
export function createOtpSchema(length = 6) {
  return z
    .string()
    .trim()
    .length(length, `OTP must be exactly ${length} digits`)
    .regex(new RegExp(`^\\d{${length}}$`), "OTP must contain only numbers");
}

export type OtpCode = z.infer<typeof otpSchema>;

// ── 3. Money / Financial Amount Schema ───────────────────────────────────────
/**
 * Decimal currency amount.
 * - Non-negative (0 or greater)
 * - Maximum of 2 decimal places
 * - Upper bound to prevent numerical overflow
 */
export const moneySchema = z
  .number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  })
  .nonnegative("Amount must be greater than or equal to 0")
  .max(10_000_000, "Amount cannot exceed 10,000,000")
  .refine(
    (val) => {
      // Ensure at most 2 decimal places without IEEE 754 precision glitches
      const decimalPart = val.toString().split(".")[1];
      return !decimalPart || decimalPart.length <= 2;
    },
    { message: "Amount can have at most 2 decimal places" }
  );

/**
 * Money schema that accepts string inputs (from HTML forms) and coerces to valid decimal numbers
 */
export const moneyInputSchema = z
  .union([z.number(), z.string()])
  .transform((val, ctx) => {
    const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
    if (isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid monetary amount",
      });
      return z.NEVER;
    }
    return Math.round(num * 100) / 100;
  })
  .pipe(moneySchema);

/**
 * Standard ISO 4217 Currency Code
 */
export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, "Currency must be a 3-letter ISO code")
  .default("USD");

/**
 * Complete Monetary Value object
 */
export const monetaryValueSchema = z.object({
  amount: moneySchema,
  currency: currencyCodeSchema,
});

export type Money = z.infer<typeof moneySchema>;
export type MonetaryValue = z.infer<typeof monetaryValueSchema>;

// ── 4. Geolocation Point Schema ──────────────────────────────────────────────
/**
 * Geographical coordinate point (WGS 84 / GPS standard)
 * Latitude: -90 to +90
 * Longitude: -180 to +180
 */
export const geoPointSchema = z.object({
  latitude: z
    .number({
      required_error: "Latitude is required",
      invalid_type_error: "Latitude must be a number",
    })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({
      required_error: "Longitude is required",
      invalid_type_error: "Longitude must be a number",
    })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
});

/**
 * GeoJSON [longitude, latitude] coordinate pair
 */
export const geoTupleSchema = z.tuple([
  z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
]);

export type GeoPoint = z.infer<typeof geoPointSchema>;
export type GeoTuple = z.infer<typeof geoTupleSchema>;

// ── 5. Supporting Common Primitives ─────────────────────────────────────────
/**
 * Identifier string (UUID, cuid, or non-empty slug)
 */
export const idSchema = z
  .string({ required_error: "ID is required" })
  .trim()
  .min(1, "ID cannot be empty");

/**
 * Standard Email Schema
 */
export const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Invalid email address");

/**
 * Password Schema with minimum length and security constraints
 */
export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(
    VALIDATION.PASSWORD.MIN_LENGTH,
    `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.PASSWORD.MAX_LENGTH,
    `Password cannot exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`
  );

/**
 * Pagination Query Parameters Schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
