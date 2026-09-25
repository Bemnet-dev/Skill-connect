import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Button Primitive
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable button primitive following the SkillConnect / MyJob design system:
 * - Brand Navy (#0A1B39) and Brand Blue (#0A65CC) primary hierarchy
 * - Subtle micro-interactions (hover, active, focus-visible)
 * - Accessible loading spinner state with disabled interaction
 */

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-hover shadow-sm active:translate-y-[0.5px]",
        secondary:
          "bg-primary-light text-primary hover:bg-[#CEE0F5] active:translate-y-[0.5px]",
        outline:
          "border border-gray-200 bg-white text-gray-900 hover:border-primary hover:bg-primary-50 hover:text-primary active:bg-gray-100",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
        danger:
          "bg-danger text-white hover:bg-[#E03137] shadow-sm active:translate-y-[0.5px]",
        dark:
          "bg-brand-navy text-white hover:bg-brand-navy-dark shadow-sm active:translate-y-[0.5px]",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        md: "h-10 px-4 py-2 text-sm rounded-md gap-2",
        lg: "h-12 px-6 text-base rounded-lg gap-2.5",
        xl: "h-14 px-8 text-lg rounded-lg gap-3",
        icon: "h-10 w-10 p-0 rounded-md shrink-0",
        "icon-sm": "h-8 w-8 p-0 rounded-md shrink-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Displays spinning loading indicator and disables user interaction */
  isLoading?: boolean;
  /** Custom label displayed while loading */
  loadingText?: string;
  /** Leading icon rendered before button text */
  leftIcon?: React.ReactNode;
  /** Trailing icon rendered after button text */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={props.type || "button"}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isButtonDisabled}
        aria-busy={isLoading}
        aria-disabled={isButtonDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
