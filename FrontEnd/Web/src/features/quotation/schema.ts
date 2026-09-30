import { z } from "zod";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Quotation & Job Request Validation Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const jobRequestStatusSchema = z.enum([
  "Open",
  "Quoted",
  "Assigned",
  "Closed",
  "Cancelled",
]);

export const quoteStatusSchema = z.enum([
  "Pending",
  "Accepted",
  "Rejected",
  "Countered",
  "Expired",
]);

export const createJobRequestSchema = z.object({
  categoryId: z.number().int().positive("Category is required"),
  description: z.string().min(10, "Please provide at least 10 characters describing the job"),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  address: z.string().min(3, "Service address is required"),
});

export const updateJobRequestStatusSchema = z.object({
  status: jobRequestStatusSchema,
});

export const jobRequestSchema = z.object({
  id: z.number(),
  customerId: z.string(),
  customerName: z.string().optional().nullable(),
  categoryId: z.number(),
  categoryName: z.string().optional().nullable(),
  description: z.string(),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  address: z.string(),
  status: jobRequestStatusSchema,
  quotesCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string().optional().nullable(),
});

export const createQuoteSchema = z.object({
  jobRequestId: z.number().int().positive("Job request ID is required"),
  price: z.number().positive("Quote price must be greater than 0 ETB"),
  message: z.string().max(1000, "Message cannot exceed 1000 characters").optional().default(""),
  expiresAt: z.string().optional(),
});

export const counterOfferSchema = z.object({
  quoteId: z.number().int().positive(),
  price: z.number().positive("Counter offer must be greater than 0 ETB"),
  message: z.string().max(1000).optional(),
});

export const updateQuoteStatusSchema = z.object({
  status: quoteStatusSchema,
});

export const quoteSchema = z.object({
  id: z.number(),
  jobRequestId: z.number(),
  workerProfileId: z.number(),
  workerName: z.string().optional().nullable(),
  workerAvatar: z.string().optional().nullable(),
  workerRating: z.number().optional().nullable(),
  price: z.number(),
  currency: z.string().default("ETB"),
  message: z.string().optional().nullable(),
  status: quoteStatusSchema,
  expiresAt: z.string().optional().nullable(),
  createdAt: z.string(),
});

export type JobRequestStatus = z.infer<typeof jobRequestStatusSchema>;
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;
export type CreateJobRequestInput = z.infer<typeof createJobRequestSchema>;
export type UpdateJobRequestStatusInput = z.infer<typeof updateJobRequestStatusSchema>;
export type JobRequest = z.infer<typeof jobRequestSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type CounterOfferInput = z.infer<typeof counterOfferSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
export type Quote = z.infer<typeof quoteSchema>;
