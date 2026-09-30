"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { getSafeCallbackUrl } from "@/middleware";

/**
 * Inner component that uses useSearchParams - must be wrapped in Suspense
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Preserve any callbackUrl the middleware set when redirecting here
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl = getSafeCallbackUrl(rawCallback) ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "" },
  });

  const { mutate: requestOtp, isPending } = useLogin({
    onSuccess: (_data, variables) => {
      // Resolve phone from the various input shapes useLogin accepts
      const phone =
        typeof variables === "string"
          ? variables
          : "phone" in variables
          ? variables.phone
          : variables.phoneNumber;

      const params = new URLSearchParams({ phone });
      if (callbackUrl) params.set("callbackUrl", callbackUrl);

      router.push(`/verify-otp?${params.toString()}`);
    },
  });

  function onSubmit(data: LoginInput) {
    requestOtp(data);
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-200 px-8 py-10">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Sign in to SkillConnect
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Enter your phone number and we&apos;ll send you a verification code.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          {...register("phone")}
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus
          placeholder="+251 9XX XXX XXX"
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.phone?.message}
          helperText="Any phone number in E.164 format (e.g. +251911234567)"
          disabled={isPending}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isPending}
          loadingText="Sending code…"
        >
          Send verification code
        </Button>

        {/* Telegram delivery notice */}
        <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <svg
            className="h-4 w-4 text-blue-500 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.65l-2.967-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.835.95l-.52-.041z" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">OTP delivered via Telegram.</span>{" "}
            If you&apos;ve registered with{" "}
            <a
              href="https://t.me/skillconnect_dev_bot?start=auth"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-blue-900"
            >
              @skillconnect_dev_bot
            </a>
            , the code goes to <span className="font-medium">your personal chat</span>.
            Otherwise it&apos;s sent to the admin channel.
          </p>
        </div>
      </form>

      {/* Sign-up note */}
      <p className="mt-6 text-center text-xs text-gray-400">
        Don&apos;t have an account?{" "}
        <span className="text-gray-600">
          Just enter your number — we&apos;ll create one for you automatically.
        </span>
      </p>
    </div>
  );
}

/**
 * Login Page — /login
 *
 * Phone-only passwordless entry point.
 * Submits to useLogin() which calls requestOtp(), then redirects to
 * /verify-otp?phone=<encoded> so the OTP step has the number in the URL.
 *
 * The callbackUrl from the query string is forwarded to /verify-otp
 * so the final redirect after verification lands the user in the right place.
 */
export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="bg-white rounded-2xl shadow-card border border-gray-200 px-8 py-10">Loading…</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
