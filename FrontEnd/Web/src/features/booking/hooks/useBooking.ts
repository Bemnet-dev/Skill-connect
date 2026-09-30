"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/state/query/queryKeys";
import { getBookingById, updateBookingStatus } from "../api";
import { type Booking, type BookingStatus } from "../schema";

export interface UseBookingOptions {
  staleTime?: number;
  refetchInterval?: number | false;
}

/**
 * Hook to retrieve and observe a single booking's state.
 * Per SC-FE-003 §3/§8.3, status-sensitive client islands use staleTime: 0.
 */
export function useBooking(
  bookingId: number | string,
  options?: UseBookingOptions
) {
  return useQuery<Booking, Error>({
    queryKey: queryKeys.bookings.detail(String(bookingId)),
    queryFn: ({ signal }) => getBookingById(bookingId, { signal }),
    enabled: Boolean(bookingId),
    staleTime: options?.staleTime ?? 0,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Mutation hook for updating booking status (e.g. CheckedIn, InProgress, Completed).
 */
export function useUpdateBookingStatus(bookingId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<Booking, Error, BookingStatus>({
    mutationFn: (status: BookingStatus) => updateBookingStatus(bookingId, status),
    onSuccess: (updatedBooking) => {
      // Update the specific booking in cache immediately
      queryClient.setQueryData(
        queryKeys.bookings.detail(String(bookingId)),
        updatedBooking
      );
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
    },
  });
}

export default useBooking;
