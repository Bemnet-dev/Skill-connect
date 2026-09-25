import { apiClient, setAuthToken, clearAuthTokens, RequestOptions } from "@/lib/api-client";
import {
  loginSchema,
  verifyOtpSchema,
  sessionSchema,
  LoginInput,
  VerifyOtpInput,
  SessionResponse,
} from "./schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth Feature API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight API methods dispatching phone authentication, OTP verification,
 * and session teardown through the unified apiClient singleton.
 * Responses are strictly parsed and validated against sessionSchema.
 */

export interface RequestOtpResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Requests a one-time verification code for a phone number.
 * Validates input through loginSchema before dispatching to the auth endpoint.
 *
 * @param input - Phone number string or LoginInput object ({ phone: string })
 * @param options - Optional request configuration (timeout, baseUrl, etc.)
 */
export async function requestOtp(
  input: LoginInput | { phoneNumber: string } | string,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<RequestOtpResponse> {
  const phone =
    typeof input === "string"
      ? input
      : "phone" in input
      ? input.phone
      : input.phoneNumber;

  const validated = loginSchema.parse({ phone });

  const response = await apiClient.post<RequestOtpResponse>(
    "/api/auth/phone-number/send-otp",
    {
      phoneNumber: validated.phone,
    },
    options
  );

  return {
    message: response?.message || "Verification code sent successfully",
    ...(response || {}),
    success: response?.success ?? true,
  };
}

/**
 * Verifies the OTP code for a phone number and signs in the user.
 * Validates input through verifyOtpSchema and parses backend response through sessionSchema.
 *
 * @param input - VerifyOtpInput object ({ phone: string, code: string })
 * @param options - Optional request configuration
 * @returns Validated SessionResponse with authenticated user and session details
 */
export async function verifyOtp(
  input: VerifyOtpInput | { phoneNumber: string; code: string },
  options?: Omit<RequestOptions, "method" | "body">
): Promise<SessionResponse> {
  const phone = "phone" in input ? input.phone : input.phoneNumber;
  const validated = verifyOtpSchema.parse({
    phone,
    code: input.code,
  });

  const rawResponse = await apiClient.post<unknown>(
    "/api/auth/sign-in/phone-number",
    {
      phoneNumber: validated.phone,
      code: validated.code,
    },
    options
  );

  // Unwrap envelope if backend returns { data: { user, session } }
  const payload =
    rawResponse &&
    typeof rawResponse === "object" &&
    "data" in rawResponse &&
    rawResponse.data
      ? (rawResponse as { data: unknown }).data
      : rawResponse;

  const session = sessionSchema.parse(payload);

  // Automatically synchronize token into storage if issued
  if (session.token) {
    setAuthToken(session.token);
  } else if (session.session?.token) {
    setAuthToken(session.session.token);
  }

  return session;
}

/**
 * Terminates the current active session and cleans up local auth tokens.
 * Dispatches sign-out request and clears client-side tokens even if the server request fails.
 *
 * @param options - Optional request configuration
 */
export async function logout(
  options?: Omit<RequestOptions, "method" | "body">
): Promise<void> {
  try {
    await apiClient.post("/api/auth/sign-out", undefined, options);
  } finally {
    clearAuthTokens();
  }
}
