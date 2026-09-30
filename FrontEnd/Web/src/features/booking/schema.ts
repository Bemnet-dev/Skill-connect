import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Booking Validation Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const bookingStatusSchema = z.enum([
  "Confirmed",
  "CheckedIn",
  "InProgress",
  "Completed",
  "Disputed",
  "Cancelled",
]);

export const createBookingSchema = z.object({
  quoteId: z.number().int().positive("Quote ID must be a valid positive integer"),
});

export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
});

export const bookingSchema = z.object({
  id: z.number(),
  quoteId: z.number(),
  customerId: z.string(),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  workerProfileId: z.number(),
  workerName: z.string().optional().nullable(),
  workerAvatar: z.string().optional().nullable(),
  workerPhone: z.string().optional().nullable(),
  categoryName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: bookingStatusSchema,
  totalPrice: z.number(),
  currency: z.string().default("ETB"),
  address: z.string().default("Addis Ababa"),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  checkedInAt: z.string().optional().nullable(),
  checkedOutAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  createdAt: z.string(),
  chatThreadId: z.number().optional().nullable(),
  isPaid: z.boolean().default(false),
  paymentStatus: z.string().optional().nullable(),
});

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type Booking = z.infer<typeof bookingSchema>;
