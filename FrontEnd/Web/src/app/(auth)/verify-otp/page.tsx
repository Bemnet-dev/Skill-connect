"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useVerifyOtp } from "@/features/auth/hooks/useVerifyOtp";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { verifyOtpSchema, type VerifyOtpInput } from "@/features/auth/schema";
import { getRoleHomeRoute, getSafeCallbackUrl } from "@/middleware";

/**
 * Verify OTP Page — /verify-otp
 *
 * Reads ?phone from the URL (set by the login page) and presents a 6-digit
 * code input. On success, redirects the user to their role home or the
 * callbackUrl that the middleware originally set before sending them to /login.
 *
 * Also provides a "resend code" path that re-fires useLogin() with the same
 * phone number, giving the user a fresh OTP without navigating away.
 */
export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Phone and callback forwarded from /login
  const phone = searchParams.get("phone") ?? "";
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl = getSafeCallbackUrl(rawCallback);

  // Resend cooldown state
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const cooldownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // If no phone in URL, send back to login immediately
  React.useEffect(() => {
    if (!phone) {
      router.replace("/login");
    }
  }, [phone, router]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { phone, code: "" },
  });

  // Verify mutation — on success, derive redirect target from session role
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp({
    onSuccess: (session) => {
      const role = (session?.user?.role as string | undefined) ?? undefined;
      const destination = callbackUrl ?? getRoleHomeRoute(role);
      router.replace(destination);
    },
    onError: () => {
      // Toast is already shown by the hook — also focus the code field
      setError("code", {
        message: "Incorrect code. Please check and try again.",
      });
    },
  });

  // Resend mutation — reuses useLogin with the same phone
  const { mutate: resendOtp, isPending: isResending } = useLogin({
    onSuccess: () => {
      // Start a 30-second cooldown to prevent spam
      setResendCooldown(30);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current!);
            cooldownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
  });

  // Clean up the interval on unmount
  React.useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function onSubmit(data: VerifyOtpInput) {
    verifyOtp(data);
  }

  function handleResend() {
    if (!phone || resendCooldown > 0 || isResending) return;
    resendOtp({ phone });
  }

  const isBusy = isVerifying || isResending;
  // Mask the phone number for display: +251 9XX XXX **34 → show last 2 digits
  const maskedPhone = phone
    ? phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4)
    : "";

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-200 px-8 py-10">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        aria-label="Back to login"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Heading */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-light mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Enter verification code
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          We sent a 6-digit code to your{" "}
          <span className="font-semibold text-blue-600">Telegram</span>.
          The phone number used was{" "}
          <span className="font-semibold text-gray-700">{maskedPhone}</span>.
          Code expires in 5 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/*
          Hidden phone field — keeps the phone value in the form data so
          verifyOtpSchema gets both phone + code on submit.
        */}
        <input type="hidden" {...register("phone")} value={phone} />

        <Input
          {...register("code")}
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          maxLength={6}
          error={errors.code?.message}
          helperText="6-digit code from your SMS"
          disabled={isBusy}
          className="tracking-[0.35em] text-center font-mono text-lg"
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isVerifying}
          loadingText="Verifying…"
          disabled={isBusy}
        >
          Verify &amp; sign in
        </Button>
      </form>

      {/* Resend code */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          Didn&apos;t receive it on Telegram?{" "}
          {resendCooldown > 0 ? (
            <span className="text-gray-500">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isBusy}
              className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              {isResending ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
