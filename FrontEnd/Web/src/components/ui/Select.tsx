import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Select Primitive
 * ─────────────────────────────────────────────────────────────────────────────
 * Accessible, customizable dropdown select primitive.
 * Accepts either an options array or standard <option> children.
 */

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Label displayed above the select element */
  label?: string;
  /** Explanatory helper text displayed below */
  helperText?: string;
  /** Error message displayed below in red */
  error?: string;
  /** Placeholder item displayed when no value is selected */
  placeholder?: string;
  /** Structured options list (alternative to passing children) */
  options?: SelectOption[];
  /** Leading icon inside the left edge */
  leftIcon?: React.ReactNode;
  /** Sizing variant */
  selectSize?: "sm" | "md" | "lg";
  /** Custom wrapper container className */
  containerClassName?: string;
}

const selectSizeClasses = {
  sm: "h-8 pl-2.5 pr-8 text-xs rounded-md",
  md: "h-10 pl-3.5 pr-9 text-sm rounded-md",
  lg: "h-12 pl-4 pr-10 text-base rounded-lg",
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      placeholder,
      options,
      leftIcon,
      selectSize = "md",
      disabled,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-gray-700 select-none tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400 shrink-0">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full appearance-none bg-white text-gray-900 border transition-all duration-150 focus:outline-none focus:ring-1 cursor-pointer",
              selectSizeClasses[selectSize],
              leftIcon && "pl-9",
              hasError
                ? "border-danger focus:border-danger focus:ring-danger text-danger"
                : "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-primary",
              disabled && "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200 select-none",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-gray-400">
                {placeholder}
              </option>
            )}

            {options
              ? options.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="text-gray-900"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Custom Chevron Indicator */}
          <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        {error && (
          <p id={errorId} className="text-xs font-medium text-danger animate-fadeIn">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
