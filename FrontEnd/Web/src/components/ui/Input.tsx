import * as React from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Input Primitive
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable text input primitive with:
 * - Label, helper text, and validation error messages
 * - Leading/trailing icon slots and addons
 * - Built-in show/hide password toggle
 * - Accessible IDs and ARIA description linking
 */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Optional form field label */
  label?: string;
  /** Explanatory helper text displayed below the input */
  helperText?: string;
  /** Error message displayed in red below the input */
  error?: string;
  /** Icon displayed inside the left edge of the input */
  leftIcon?: React.ReactNode;
  /** Icon displayed inside the right edge of the input */
  rightIcon?: React.ReactNode;
  /** Fixed text or element attached to the left edge outside the input */
  leftAddon?: React.ReactNode;
  /** Fixed text or element attached to the right edge outside the input */
  rightAddon?: React.ReactNode;
  /** When true, renders a password field with an eye toggle button */
  isPassword?: boolean;
  /** When true and value is present, renders a clear (X) button */
  clearable?: boolean;
  /** Callback fired when the clear button is clicked */
  onClear?: () => void;
  /** Sizing variant */
  inputSize?: "sm" | "md" | "lg";
  /** Custom wrapper container className */
  containerClassName?: string;
}

const inputSizeClasses = {
  sm: "h-8 px-2.5 text-xs rounded-md",
  md: "h-10 px-3.5 text-sm rounded-md",
  lg: "h-12 px-4 text-base rounded-lg",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      isPassword = false,
      clearable = false,
      onClear,
      inputSize = "md",
      disabled,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

    const hasError = Boolean(error);
    const hasValue = value !== undefined && value !== "";

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-700 select-none tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center rounded-md">
          {leftAddon && (
            <div className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-600 text-sm rounded-l-md select-none shrink-0 self-stretch">
              {leftAddon}
            </div>
          )}

          <div className="relative flex-1 flex items-center">
            {leftIcon && (
              <div className="absolute left-3 flex items-center pointer-events-none text-gray-400 shrink-0">
                {leftIcon}
              </div>
            )}

            <input
              ref={ref}
              id={inputId}
              type={resolvedType}
              disabled={disabled}
              value={value}
              aria-invalid={hasError}
              aria-describedby={
                hasError ? errorId : helperText ? helperId : undefined
              }
              className={cn(
                "w-full bg-white text-gray-900 border transition-all duration-150 placeholder:text-gray-400 focus:outline-none focus:ring-1",
                inputSizeClasses[inputSize],
                leftIcon && "pl-9",
                (rightIcon || isPassword || clearable) && "pr-10",
                leftAddon && "rounded-l-none",
                rightAddon && "rounded-r-none",
                hasError
                  ? "border-danger focus:border-danger focus:ring-danger text-danger"
                  : "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-primary",
                disabled && "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200 select-none",
                className
              )}
              {...props}
            />

            {/* Trailing action icons: Clear, Password Toggle, or custom rightIcon */}
            <div className="absolute right-3 flex items-center gap-1.5 text-gray-400">
              {clearable && hasValue && !disabled && (
                <button
                  type="button"
                  onClick={onClear}
                  tabIndex={-1}
                  className="p-0.5 rounded hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear input value"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {isPassword && !disabled && (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="p-0.5 rounded hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}

              {rightIcon && !isPassword && !clearable && (
                <div className="flex items-center pointer-events-none">
                  {rightIcon}
                </div>
              )}
            </div>
          </div>

          {rightAddon && (
            <div className="inline-flex items-center px-3 border border-l-0 border-gray-200 bg-gray-50 text-gray-600 text-sm rounded-r-md select-none shrink-0 self-stretch">
              {rightAddon}
            </div>
          )}
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

Input.displayName = "Input";

export default Input;
