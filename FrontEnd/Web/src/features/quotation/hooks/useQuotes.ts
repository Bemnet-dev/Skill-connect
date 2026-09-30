"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/state/query/queryKeys";
import {
  submitQuote,
  getQuoteById,
  getMyQuotes,
  getQuotesForJobRequest,
  updateQuoteStatus,
  submitCounterOffer,
} from "../api";
import {
  type CreateQuoteInput,
  type Quote,
  type QuoteStatus,
  type CounterOfferInput,
} from "../schema";

export function useQuote(id: number | string) {
  return useQuery<Quote, Error>({
    queryKey: queryKeys.quotations.detail(id),
    queryFn: ({ signal }) => getQuoteById(id, { signal }),
    enabled: Boolean(id),
  });
}

export function useMyQuotes() {
  return useQuery<Quote[], Error>({
    queryKey: queryKeys.quotations.my(),
    queryFn: ({ signal }) => getMyQuotes({ signal }),
  });
}

export function useJobQuotes(jobRequestId: number | string) {
  return useQuery<Quote[], Error>({
    queryKey: queryKeys.quotations.byJobRequest(jobRequestId),
    queryFn: ({ signal }) => getQuotesForJobRequest(jobRequestId, { signal }),
    enabled: Boolean(jobRequestId),
  });
}

export function useSubmitQuote() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, CreateQuoteInput>({
    mutationFn: (data) => submitQuote(data),
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobRequests.detail(newQuote.jobRequestId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.lists() });
    },
  });
}

export function useUpdateQuoteStatus(quoteId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, QuoteStatus>({
    mutationFn: (status) => updateQuoteStatus(quoteId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.quotations.detail(quoteId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
    },
  });
}

export function useCounterOffer() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, CounterOfferInput>({
    mutationFn: (data) => submitCounterOffer(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.quotations.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
    },
  });
}
