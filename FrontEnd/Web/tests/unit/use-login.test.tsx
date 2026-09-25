import * as React from "react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/state/query/queryClient";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { apiClient, ApiError } from "@/lib/api-client";
import { useUiStore } from "@/state/store/uiStore";

function createWrapper() {
  const queryClient = createQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientTestWrapper";
  return Wrapper;
}

describe("useLogin Hook (src/features/auth/hooks/useLogin.ts)", () => {
  beforeEach(() => {
    useUiStore.getState().resetUi();
    jest.clearAllMocks();
  });

  it("calls requestOtp and returns response on successful mutation", async () => {
    const mockResponse = {
      success: true,
      message: "Verification code sent successfully",
    };

    const postSpy = jest
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce(mockResponse);

    const onSuccessMock = jest.fn();

    const { result } = renderHook(
      () => useLogin({ onSuccess: onSuccessMock }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ phone: "+251911234567" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      "/api/auth/phone-number/send-otp",
      { phoneNumber: "+251911234567" },
      undefined
    );
    expect(result.current.data).toEqual(mockResponse);
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSuccessMock.mock.calls[0][0]).toEqual(mockResponse);
    expect(onSuccessMock.mock.calls[0][1]).toEqual({ phone: "+251911234567" });

    // No error toasts dispatched
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("dispatches error toast and triggers custom onError on failure", async () => {
    const postSpy = jest
      .spyOn(apiClient, "post")
      .mockRejectedValueOnce(new Error("Network connection failed"));

    const onErrorMock = jest.fn();

    const { result } = renderHook(
      () => useLogin({ onError: onErrorMock }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ phone: "+251911234567" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][0].message).toBe("Network connection failed");
    expect(onErrorMock.mock.calls[0][1]).toEqual({ phone: "+251911234567" });

    // Verifies an error toast was dispatched into uiStore
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("error");
    expect(toasts[0].title).toBe("Login Failed");
    expect(toasts[0].message).toBe("Network connection failed");
  });

  it("extracts error detail from ApiError for user-friendly toast message", async () => {
    const apiError = new ApiError({
      message: "HTTP 429 Too Many Requests",
      status: 429,
      statusText: "Too Many Requests",
      data: {
        detail: "Too many attempts. Please wait 60 seconds before retrying.",
      },
    });

    jest.spyOn(apiClient, "post").mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ phone: "+251911234567" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe(
      "Too many attempts. Please wait 60 seconds before retrying."
    );
  });
});
