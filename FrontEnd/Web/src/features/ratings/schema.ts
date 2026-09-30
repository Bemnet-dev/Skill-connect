import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Ratings & Reviews Validation Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const createReviewSchema = z.object({
  bookingId: z.number().int().positive("Booking ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Minimum rating is 1 star")
    .max(5, "Maximum rating is 5 stars"),
  comment: z
    .string()
    .min(5, "Please provide at least 5 characters for your review")
    .max(1000, "Review cannot exceed 1000 characters"),
});

export const reviewSchema = z.object({
  id: z.number(),
  bookingId: z.number(),
  customerId: z.string(),
  customerName: z.string().optional().nullable(),
  customerAvatar: z.string().optional().nullable(),
  workerProfileId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type Review = z.infer<typeof reviewSchema>;
