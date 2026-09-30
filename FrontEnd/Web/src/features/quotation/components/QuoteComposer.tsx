"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSubmitQuote } from "../hooks/useQuotes";

const quoteFormSchema = z.object({
  price: z
    .number({ invalid_type_error: "Price must be a valid number" })
    .positive("Price must be greater than 0 ETB"),
  message: z.string().max(1000),
  expiryDays: z.number().int().min(1).max(30),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

export interface QuoteComposerProps {
  jobRequestId: number;
  initialPrice?: number;
  onSuccess?: () => void;
}

export function QuoteComposer({
  jobRequestId,
  initialPrice,
  onSuccess,
}: QuoteComposerProps) {
  const [submitted, setSubmitted] = useState(false);
  const { mutate: submitQuote, isPending, isError, error } = useSubmitQuote();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      price: initialPrice || 0,
      message: "",
      expiryDays: 7,
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiryDays);

    submitQuote(
      {
        jobRequestId,
        price: data.price,
        message: data.message,
        expiresAt: expiresAt.toISOString(),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          reset();
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
        <h4 className="font-semibold text-emerald-900 text-lg">Quote Submitted!</h4>
        <p className="text-sm text-emerald-700 mt-1 mb-4">
          The customer has been notified and can review your quote.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSubmitted(false)}
        >
          Submit another quote
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
    >
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-lg font-bold text-gray-900">Submit Your Quote</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Provide your estimated pricing in Ethiopian Birr (ETB) and scope details.
        </p>
      </div>

      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error?.message || "Failed to submit quote. Please try again."}</span>
        </div>
      )}

      <div>
        <Input
          label="Estimated Price (ETB)"
          type="number"
          step="any"
          placeholder="e.g. 1500"
          error={errors.price?.message}
          {...register("price", { valueAsNumber: true })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message / Scope Details
        </label>
        <textarea
          rows={3}
          placeholder="Explain what is included in your estimate, timeline, and parts needed..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register("message")}
        />
        {errors.message && (
          <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quote Validity
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          {...register("expiryDays", { valueAsNumber: true })}
        >
          <option value={3}>Valid for 3 days</option>
          <option value={7}>Valid for 7 days (Recommended)</option>
          <option value={14}>Valid for 14 days</option>
          <option value={30}>Valid for 30 days</option>
        </select>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          fullWidth
          isLoading={isPending}
          loadingText="Submitting Quote..."
          className="flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Quote to Customer
        </Button>
      </div>
    </form>
  );
}

export default QuoteComposer;
