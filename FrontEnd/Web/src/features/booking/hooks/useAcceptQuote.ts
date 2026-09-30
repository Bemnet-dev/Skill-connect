"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/state/query/queryKeys";
import { createBooking } from "../api";
import { updateQuoteStatus } from "@/features/quotation/api";
import { type Booking } from "../schema";

export interface AcceptQuoteParams {
  quoteId: number;
}

/**
 * useAcceptQuote Hook
 *
 * Confirms customer acceptance of a quote and creates a confirmed Booking record.
 * Per architectural refactor: Reads userId and authentication status from
 * `authClient.useSession()` instead of the deprecated Zustand `authStore`.
 */
export function useAcceptQuote() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  return useMutation<Booking, Error, AcceptQuoteParams>({
    mutationFn: async ({ quoteId }) => {
      if (!currentUserId) {
        throw new Error("You must be logged in to accept a quote");
      }

      // Mark quote accepted on backend
      try {
        await updateQuoteStatus(quoteId, "Accepted");
      } catch {
        // If status update fails, proceed to booking creation or let it fail there
      }

      // Create booking linked to the accepted quote
      const newBooking = await createBooking({ quoteId });
      return newBooking;
    },
    onSuccess: (booking) => {
      // Invalidate quotations and bookings caches
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.setQueryData(
        queryKeys.bookings.detail(String(booking.id)),
        booking
      );
    },
  });
}

export default useAcceptQuote;
