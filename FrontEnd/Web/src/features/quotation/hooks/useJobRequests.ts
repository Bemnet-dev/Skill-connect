"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/state/query/queryKeys";
import {
  createJobRequest,
  getJobRequestById,
  getMyJobRequests,
  getOpenJobRequests,
  updateJobRequestStatus,
} from "../api";
import {
  type CreateJobRequestInput,
  type JobRequest,
  type JobRequestStatus,
} from "../schema";

export function useJobRequest(id: number | string) {
  return useQuery<JobRequest, Error>({
    queryKey: queryKeys.jobRequests.detail(id),
    queryFn: ({ signal }) => getJobRequestById(id, { signal }),
    enabled: Boolean(id),
  });
}

export function useMyJobRequests() {
  return useQuery<JobRequest[], Error>({
    queryKey: queryKeys.jobRequests.my(),
    queryFn: ({ signal }) => getMyJobRequests({ signal }),
  });
}

export function useOpenJobRequests() {
  return useQuery<JobRequest[], Error>({
    queryKey: queryKeys.jobRequests.open(),
    queryFn: ({ signal }) => getOpenJobRequests({ signal }),
  });
}

export function useCreateJobRequest() {
  const queryClient = useQueryClient();

  return useMutation<JobRequest, Error, CreateJobRequestInput>({
    mutationFn: (data) => createJobRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.all });
    },
  });
}

export function useUpdateJobRequestStatus(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation<JobRequest, Error, JobRequestStatus>({
    mutationFn: (status) => updateJobRequestStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.jobRequests.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.lists() });
    },
  });
}
