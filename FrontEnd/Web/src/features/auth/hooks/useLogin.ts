"use client";

import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { requestOtp, RequestOtpResponse } from "../api";
import { LoginInput } from "../schema";
import { toast } from "@/state/store/uiStore";
import { isApiError } from "@/lib/api-client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useLogin Hook
 * ─────────────────────────────────────────────────────────────────────────────
 * TanStack mutation hook wrapping requestOtp() to initiate phone authentication.
 * Automatically dispatches a feedback error toast on mutation failure.
 */

export type LoginVariables = LoginInput | { phoneNumber: string } | string;

export type UseLoginOptions = Omit<
  UseMutationOptions<RequestOtpResponse, Error, LoginVariables>,
  "mutationFn"
>;

/**
 * Mutation hook for requesting OTP verification code for a phone number.
 *
 * @example
 * ```tsx
 * const { mutate: login, isPending } = useLogin({
 *   onSuccess: (data) => {
 *     router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
 *   },
 * });
 *
 * // Trigger login:
 * login({ phone: "+251911234567" });
 * ```
 */
export function useLogin(
  options?: UseLoginOptions
): UseMutationResult<RequestOtpResponse, Error, LoginVariables> {
  const { onError, ...restOptions } = options || {};

  return useMutation<RequestOtpResponse, Error, LoginVariables>({
    mutationFn: (variables: LoginVariables) => requestOtp(variables),
    ...restOptions,
    onError: (...args) => {
      const [error] = args;
      const errorMessage = isApiError(error)
        ? error.data?.detail || error.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "Failed to send verification code. Please try again.";

      toast.error(errorMessage, {
        title: "Login Failed",
      });

      if (onError) {
        // Forward all arguments passed by TanStack Query
        (onError as (...a: typeof args) => unknown)(...args);
      }
    },
  });
}

export default useLogin;
