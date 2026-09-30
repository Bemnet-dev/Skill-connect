"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/state/query/queryKeys";
import { getMyBookings, getWorkerBookings } from "../api";
import { type Booking } from "../schema";

export function useMyBookings() {
  return useQuery<Booking[], Error>({
    queryKey: queryKeys.bookings.lists(),
    queryFn: ({ signal }) => getMyBookings({ signal }),
  });
}

export function useWorkerBookings(workerProfileId: number | string) {
  return useQuery<Booking[], Error>({
    queryKey: queryKeys.bookings.workerList(String(workerProfileId)),
    queryFn: ({ signal }) => getWorkerBookings(workerProfileId, { signal }),
    enabled: Boolean(workerProfileId),
  });
}
