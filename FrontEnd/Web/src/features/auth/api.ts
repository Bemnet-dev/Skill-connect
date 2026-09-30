import { authClient } from "@/lib/auth-client";
import { setAuthToken, clearAuthTokens } from "@/lib/api-client";
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
 * Uses Better Auth's client directly for all auth operations so requests go
 * to /api/auth/* on the Next.js server (localhost:3000), NOT the C# backend.
 */

export interface RequestOtpResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Requests a one-time verification code for a phone number.
 */
export async function requestOtp(
  input: LoginInput | { phoneNumber: string } | string
): Promise<RequestOtpResponse> {
  const phone =
    typeof input === "string"
      ? input
      : "phone" in input
      ? input.phone
      : input.phoneNumber;

  const validated = loginSchema.parse({ phone });

  const { data, error } = await authClient.phoneNumber.sendOtp({
    phoneNumber: validated.phone,
  });

  if (error) {
    throw new Error(error.message || "Failed to send verification code");
  }

  return {
    success: true,
    ...(data || {}),
    message: data?.message || "Verification code sent to Telegram",
  };
}

/**
 * Verifies the OTP code and signs in the user.
 */
export async function verifyOtp(
  input: VerifyOtpInput | { phoneNumber: string; code: string }
): Promise<SessionResponse> {
  const phone = "phone" in input ? input.phone : input.phoneNumber;
  const validated = verifyOtpSchema.parse({ phone, code: input.code });

  const { data, error } = await authClient.phoneNumber.verify({
    phoneNumber: validated.phone,
    code: validated.code,
  });

  if (error) {
    throw new Error(error.message || "Invalid verification code");
  }

  // Fetch the JWT for the C# backend after sign-in
  const tokenResult = await authClient.token();
  const token = tokenResult?.data?.token ?? undefined;

  if (token) {
    setAuthToken(token);
  }

  const session = sessionSchema.parse({
    user: data?.user ?? {},
    token,
  });

  return session;
}

/**
 * Signs out and clears local tokens.
 */
export async function logout(): Promise<void> {
  try {
    await authClient.signOut();
  } finally {
    clearAuthTokens();
  }
}
