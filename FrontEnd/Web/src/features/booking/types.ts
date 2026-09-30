export type {
  BookingStatus,
  CreateBookingInput,
  UpdateBookingStatusInput,
  Booking,
} from "./schema";

export interface BookingFilters {
  status?: string;
  role?: "customer" | "worker";
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}
