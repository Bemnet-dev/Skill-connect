import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/state/query/queryClient";
import { useVerifyOtp } from "@/features/auth/hooks/useVerifyOtp";
import { useAuthStore, authStore } from "@/state/store/authStore";
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
    authStore.reset();
    clearAuthTokens();
    useUiStore.getState().resetUi();
    jest.clearAllMocks();
  });

  it("on success calls authStore.setSession() to log the user in", async () => {
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

    const setSessionSpy = jest.spyOn(authStore, "setSession");
    const onSuccessMock = jest.fn();

    // Verify initial unauthenticated state
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();

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

    // ── Canonical Login Verification ──────────────────────────────────────────
    // 1. authStore.setSession() was called with parsed session response
    expect(setSessionSpy).toHaveBeenCalledTimes(1);
    expect(setSessionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ id: "usr_verified_777" }),
      })
    );

    // 2. Zustand state is now authenticated!
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.userId).toBe("usr_verified_777");
    expect(authState.role).toBe("worker");
    expect(authState.user?.name).toBe("Dawit Electrician");
    expect(authState.permissions.length).toBeGreaterThan(0);

    // 3. Tokens were synchronized
    expect(getAuthToken()).toBe("bearer_api_jwt_token_999");

    // 4. Custom onSuccess callback executed with parsed session
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSuccessMock.mock.calls[0][0].user.id).toBe("usr_verified_777");
    expect(onSuccessMock.mock.calls[0][0].token).toBe("bearer_api_jwt_token_999");

    // 5. No error toasts dispatched
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
    expect(onErrorMock.mock.calls[0][0].message).toBe(
      "Invalid verification code"
    );

    // User remains unauthenticated
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Error toast was dispatched
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("error");
    expect(toasts[0].title).toBe("Verification Failed");
    expect(toasts[0].message).toBe("Invalid verification code");
  });

  it("extracts problem details message from ApiError on 400 Bad Request", async () => {
    const apiError = new ApiError({
      message: "HTTP 400 Bad Request",
      status: 400,
      statusText: "Bad Request",
      data: {
        detail: "The provided OTP has expired. Please request a new one.",
      },
    });

    jest.spyOn(apiClient, "post").mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useVerifyOtp(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ phone: "+251911234567", code: "123456" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe(
      "The provided OTP has expired. Please request a new one."
    );
  });
});
