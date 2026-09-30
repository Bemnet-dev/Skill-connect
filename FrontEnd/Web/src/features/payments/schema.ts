import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Payment & Escrow Validation Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const paymentProviderSchema = z.enum(["Telebirr", "Chapa", "CBE Birr"]);

export const paymentStatusSchema = z.enum([
  "Pending",
  "Held",
  "Released",
  "Refunded",
  "Failed",
]);

export const createPaymentSchema = z.object({
  bookingId: z.number().int().positive("Valid booking ID is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  provider: paymentProviderSchema,
});

export const updatePaymentStatusSchema = z.object({
  status: paymentStatusSchema,
});

export const paymentRecordSchema = z.object({
  id: z.number(),
  bookingId: z.number(),
  amount: z.number(),
  currency: z.string().default("ETB"),
  provider: paymentProviderSchema,
  status: paymentStatusSchema,
  transactionReference: z.string().optional().nullable(),
  createdAt: z.string(),
  releasedAt: z.string().optional().nullable(),
});

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
