"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StarRating } from "./StarRating";
import { useSubmitReview } from "../hooks/useReviews";
import { createReviewSchema, type CreateReviewInput } from "../schema";

export interface ReviewFormProps {
  bookingId: number;
  workerName?: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  bookingId,
  workerName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: submitReview, isPending, isError, error } = useSubmitReview();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      bookingId,
      rating: 5,
      comment: "",
    },
  });

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setValue("rating", newRating, { shouldValidate: true });
  };

  const onSubmit = (data: CreateReviewInput) => {
    submitReview(data, {
      onSuccess: () => {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      },
    });
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h4 className="font-bold text-gray-900 text-lg">Thank You for Your Review!</h4>
        <p className="text-sm text-gray-600">
          Your feedback helps build trust in the SkillConnect community.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
    >
      <div className="border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-gray-900 text-base">
            Rate Your Experience {workerName ? `with ${workerName}` : ""}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Share your experience regarding punctuality, quality of workmanship, and professionalism.
        </p>
      </div>

      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error?.message || "Failed to submit review."}</span>
        </div>
      )}

      {/* Star Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Overall Rating
        </label>
        <div className="flex items-center gap-3">
          <StarRating
            value={rating}
            size="lg"
            interactive
            onChange={handleRatingChange}
          />
          <span className="text-sm font-semibold text-gray-700">
            {rating} of 5 Stars
          </span>
        </div>
        {errors.rating && (
          <p className="text-xs text-red-600 mt-1">{errors.rating.message}</p>
        )}
      </div>

      {/* Review Comment */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Detailed Feedback
        </label>
        <textarea
          rows={3}
          placeholder="What did the technician do well? How was the service?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register("comment")}
        />
        {errors.comment && (
          <p className="text-xs text-red-600 mt-1">{errors.comment.message}</p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          fullWidth
          isLoading={isPending}
          loadingText="Submitting Review..."
        >
          Submit Customer Review
        </Button>
      </div>
    </form>
  );
}

export default ReviewForm;
