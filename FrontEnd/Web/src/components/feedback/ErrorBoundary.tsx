"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ErrorBoundary Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Catches unhandled client-side runtime errors in component subtrees and displays
 * a polished, accessible fallback UI with recovery actions.
 */

export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback element or render function */
  fallback?: React.ReactNode | ((props: FallbackProps) => React.ReactNode);
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Callback fired when error boundary is reset */
  onReset?: () => void;
  /** Whether to show technical error details/stack trace (defaults to dev mode) */
  showDetails?: boolean;
  /** Custom className for the default container */
  className?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback({
            error: this.state.error,
            resetErrorBoundary: this.resetErrorBoundary,
          });
        }
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.resetErrorBoundary}
          showDetails={this.props.showDetails}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI with recovery actions and collapsible diagnostics
 */
export function DefaultErrorFallback({
  error,
  onReset,
  showDetails = process.env.NODE_ENV !== "production",
  className,
}: {
  error: Error;
  onReset: () => void;
  showDetails?: boolean;
  className?: string;
}) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const text = `${error.name}: ${error.message}\n\nStack:\n${error.stack || "No stack trace"}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center p-6 sm:p-10 my-6 max-w-xl mx-auto rounded-2xl bg-white border border-gray-200/80 shadow-card text-center",
        className
      )}
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200/80 flex items-center justify-center text-danger mb-4 shadow-xs">
        <AlertCircle className="w-7 h-7 stroke-[2.25]" />
      </div>

      {/* Heading & Subtitle */}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
        Something went wrong
      </h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md leading-relaxed">
        An unexpected error occurred while rendering this section. You can try refreshing or returning to the home page.
      </p>

      {/* Primary Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
        <Button
          variant="primary"
          size="md"
          onClick={onReset}
          className="w-full sm:w-auto"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "secondary", size: "md" }), "w-full sm:w-auto inline-flex items-center justify-center")}
        >
          <Home className="w-4 h-4 mr-2" />
          Go to Homepage
        </Link>
      </div>

      {/* Optional Stack Trace / Details */}
      {showDetails && (
        <div className="mt-6 w-full text-left border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors py-1"
          >
            <span>Technical Details</span>
            {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {detailsOpen && (
            <div className="mt-2 text-left bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs font-mono text-gray-800 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-200 text-gray-500 text-[11px]">
                <span className="font-semibold text-danger truncate max-w-[280px]">
                  {error.name}: {error.message}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs hover:bg-gray-50"
                  aria-label="Copy error trace"
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-gray-700">
                {error.stack || error.message}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * HOC wrapper to wrap any component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
}

export default ErrorBoundary;
