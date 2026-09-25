import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Badge Primitive
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable badge / tag primitive for statuses, skill tags, job types, and filters.
 * Incorporates design tokens for contract types and semantic alert states.
 */

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border transition-colors select-none font-medium",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-light text-primary border-[#CEE0F5]",
        secondary:
          "bg-gray-100 text-gray-700 border-gray-200",
        success:
          "bg-success-light text-success border-[#A6F4C5]",
        warning:
          "bg-warning-light text-warning border-[#FEDF89]",
        danger:
          "bg-danger-light text-danger border-[#FECDCA]",
        info:
          "bg-[#E0F2FE] text-info border-[#BAE6FD]",
        navy:
          "bg-brand-navy text-white border-transparent",
        outline:
          "bg-transparent border-gray-300 text-gray-700",
        fulltime:
          "bg-badge-fulltime text-badge-fulltime-text border-transparent",
        contract:
          "bg-badge-contract text-badge-contract-text border-transparent",
        internship:
          "bg-badge-internship text-badge-internship-text border-transparent",
        featured:
          "bg-badge-featured text-badge-featured-text border-transparent",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-1",
        lg: "text-sm px-3 py-1.5",
      },
      rounded: {
        rounded: "rounded-md",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      rounded: "pill",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional indicator dot rendered before text */
  dot?: boolean;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional remove callback rendering an 'X' button for filter chips */
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  rounded,
  dot = false,
  icon,
  onRemove,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size, rounded, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "danger" && "bg-danger",
            variant === "info" && "bg-info",
            variant === "navy" && "bg-white",
            (!variant || variant === "primary") && "bg-primary",
            (variant === "secondary" || variant === "outline") && "bg-gray-500"
          )}
          aria-hidden="true"
        />
      )}

      {icon && <span className="inline-flex shrink-0">{icon}</span>}

      <span>{children}</span>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 focus:outline-none transition-colors cursor-pointer"
          aria-label="Remove badge"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

Badge.displayName = "Badge";

export default Badge;
