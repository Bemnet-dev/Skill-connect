"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/state/query/queryKeys";
import { submitReview, getWorkerReviews, getBookingReviews } from "../api";
import { type CreateReviewInput, type Review } from "../schema";

export function useWorkerReviews(workerProfileId: number | string) {
  return useQuery<Review[], Error>({
    queryKey: queryKeys.workers.reviews(String(workerProfileId)),
    queryFn: ({ signal }) => getWorkerReviews(workerProfileId, { signal }),
    enabled: Boolean(workerProfileId),
  });
}

export function useBookingReviews(bookingId: number | string) {
  return useQuery<Review[], Error>({
    queryKey: queryKeys.ratings.byBooking(String(bookingId)),
    queryFn: ({ signal }) => getBookingReviews(bookingId, { signal }),
    enabled: Boolean(bookingId),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, CreateReviewInput>({
    mutationFn: (data) => submitReview(data),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.byBooking(String(review.bookingId)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workers.reviews(String(review.workerProfileId)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workers.detail(String(review.workerProfileId)),
      });
    },
  });
}
