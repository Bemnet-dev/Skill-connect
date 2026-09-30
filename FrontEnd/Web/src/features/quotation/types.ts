export type {
  JobRequestStatus,
  QuoteStatus,
  CreateJobRequestInput,
  UpdateJobRequestStatusInput,
  JobRequest,
  CreateQuoteInput,
  CounterOfferInput,
  UpdateQuoteStatusInput,
  Quote,
} from "./schema";

export interface JobRequestFilters {
  categoryId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}
