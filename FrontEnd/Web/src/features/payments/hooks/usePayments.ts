"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/state/query/queryKeys";
import {
  createPayment,
  getPaymentById,
  getBookingPayments,
  getWorkerPayments,
} from "../api";
import { type CreatePaymentInput, type PaymentRecord } from "../schema";

export function useBookingPayment(bookingId: number | string) {
  return useQuery<PaymentRecord[], Error>({
    queryKey: queryKeys.payments.invoices(String(bookingId)),
    queryFn: ({ signal }) => getBookingPayments(bookingId, { signal }),
    enabled: Boolean(bookingId),
  });
}

export function useWorkerPayments(workerProfileId: number | string) {
  return useQuery<PaymentRecord[], Error>({
    queryKey: queryKeys.payments.history(String(workerProfileId)),
    queryFn: ({ signal }) => getWorkerPayments(workerProfileId, { signal }),
    enabled: Boolean(workerProfileId),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentRecord, Error, CreatePaymentInput>({
    mutationFn: (data) => createPayment(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.invoices(String(record.bookingId)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(String(record.bookingId)),
      });
    },
  });
}
