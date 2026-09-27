import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/state/query/queryClient";
import { useVerifyOtp } from "@/features/auth/hooks/useVerifyOtp";
import { useUiStore } from "@/state/store/uiStore";
import { apiClient, ApiError, clearAuthTokens, getAuthToken } from "@/lib/api-client";

function createWrapper() {
  const queryClient = createQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientTestWrapper";
  return Wrapper;
}

describe("useVerifyOtp Hook (src/features/auth/hooks/useVerifyOtp.ts)", () => {
  beforeEach(() => {
    clearAuthTokens();
    useUiStore.getState().resetUi();
    jest.clearAllMocks();
  });

  it("on success verifies OTP and invokes onSuccess callback with session response", async () => {
    const mockBackendSession = {
      user: {
        id: "usr_verified_777",
        phone: "+251911234567",
        role: "worker" as const,
        name: "Dawit Electrician",
        isVerified: true,
      },
      session: {
        id: "sess_active_123",
        userId: "usr_verified_777",
        token: "jwt_session_token_123",
        expiresAt: "2026-10-01T00:00:00.000Z",
      },
      token: "bearer_api_jwt_token_999",
    };

    const postSpy = jest
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce(mockBackendSession);

    const onSuccessMock = jest.fn();

    const { result } = renderHook(
      () => useVerifyOtp({ onSuccess: onSuccessMock }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ phone: "+251911234567", code: "123456" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      "/api/auth/sign-in/phone-number",
      {
        phoneNumber: "+251911234567",
        code: "123456",
      },
      undefined
    );

    // Tokens were synchronized via verifyOtp
    expect(getAuthToken()).toBe("bearer_api_jwt_token_999");

    // Custom onSuccess callback executed with parsed session
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSuccessMock.mock.calls[0][0].user.id).toBe("usr_verified_777");
    expect(onSuccessMock.mock.calls[0][0].token).toBe("bearer_api_jwt_token_999");

    // No error toasts dispatched
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("dispatches error toast and triggers custom onError on verification failure", async () => {
    const postSpy = jest
      .spyOn(apiClient, "post")
      .mockRejectedValueOnce(new Error("Invalid verification code"));

    const onErrorMock = jest.fn();

    const { result } = renderHook(
      () => useVerifyOtp({ onError: onErrorMock }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ phone: "+251911234567", code: "000000" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledTimes(1);

    // Toast error was dispatched
    const toasts = useUiStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].type).toBe("error");
    expect(toasts[0].title).toBe("Verification Failed");
  });

  it("extracts structured error message from ApiError payload", async () => {
    const apiError = new ApiError({
      message: "OTP expired",
      status: 400,
      statusText: "Bad Request",
      data: {
        detail: "The 6-digit verification code has expired. Please request a new one.",
      },
    });

    jest.spyOn(apiClient, "post").mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useVerifyOtp(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ phone: "+251911234567", code: "999999" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe(
      "The 6-digit verification code has expired. Please request a new one."
    );
  });

  it("handles object input with phoneNumber property", async () => {
    const mockBackendSession = {
      user: {
        id: "usr_verified_phone_prop",
        phone: "+251911998877",
        role: "customer" as const,
      },
      session: {
        id: "sess_456",
        userId: "usr_verified_phone_prop",
        expiresAt: "2026-10-01T00:00:00.000Z",
      },
    };

    const postSpy = jest
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce(mockBackendSession);

    const { result } = renderHook(() => useVerifyOtp(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ phoneNumber: "+251911998877", code: "654321" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledWith(
      "/api/auth/sign-in/phone-number",
      {
        phoneNumber: "+251911998877",
        code: "654321",
      },
      undefined
    );
  });
});
