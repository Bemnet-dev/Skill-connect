"use client";

import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { verifyOtp } from "../api";
import { VerifyOtpInput, SessionResponse } from "../schema";
import { toast } from "@/state/store/uiStore";
import { isApiError } from "@/lib/api-client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useVerifyOtp Hook
 * ─────────────────────────────────────────────────────────────────────────────
 * TanStack mutation hook wrapping verifyOtp() to verify code and sign in.
 * Session state is authoritatively tracked via Better Auth cookies and
 * reactive client reads at the call site.
 * Automatically dispatches an error feedback toast on failure.
 */

export type VerifyOtpVariables =
  | VerifyOtpInput
  | { phoneNumber: string; code: string };

export type UseVerifyOtpOptions = Omit<
  UseMutationOptions<SessionResponse, Error, VerifyOtpVariables>,
  "mutationFn"
>;

/**
 * Mutation hook for verifying one-time password and establishing authenticated session.
 *
 * @example
 * ```tsx
 * const { mutate: verify, isPending } = useVerifyOtp({
 *   onSuccess: (session) => {
 *     router.push("/dashboard");
 *   },
 * });
 *
 * // Trigger verification:
 * verify({ phone: "+251911234567", code: "123456" });
 * ```
 */
export function useVerifyOtp(
  options?: UseVerifyOtpOptions
): UseMutationResult<SessionResponse, Error, VerifyOtpVariables> {
  const { onSuccess, onError, ...restOptions } = options || {};

  return useMutation<SessionResponse, Error, VerifyOtpVariables>({
    mutationFn: (variables: VerifyOtpVariables) => verifyOtp(variables),
    ...restOptions,
    onSuccess: (...args) => {
      if (onSuccess) {
        (onSuccess as (...a: typeof args) => unknown)(...args);
      }
    },
    onError: (...args) => {
      const [error] = args;
      const errorMessage = isApiError(error)
        ? error.data?.detail || error.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "Failed to verify code. Please check your verification code and try again.";

      toast.error(errorMessage, {
        title: "Verification Failed",
      });

      if (onError) {
        (onError as (...a: typeof args) => unknown)(...args);
      }
    },
  });
}

export default useVerifyOtp;
