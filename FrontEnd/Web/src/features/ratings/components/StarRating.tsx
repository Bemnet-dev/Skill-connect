import React from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const starNumber = i + 1;
        const isFilled = starNumber <= Math.round(value);

        return (
          <button
            key={starNumber}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starNumber)}
            className={`transition-colors focus:outline-none ${
              interactive
                ? "cursor-pointer hover:scale-110"
                : "cursor-default pointer-events-none"
            }`}
            aria-label={`${starNumber} of ${max} stars`}
          >
            <Star
              className={`${sizeClasses} ${
                isFilled
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-300 fill-none"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
