"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useUiStore, Toast as ToastModel, ToastType, toast } from "@/state/store/uiStore";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Toast Item Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders an individual toast notification with semantic styling, auto-dismiss,
 * pause-on-hover, action triggers, and accessibility.
 */

export interface ToastItemProps {
  toast: ToastModel;
  onDismiss: () => void;
  className?: string;
}

const toastTypeStyles: Record<
  ToastType,
  {
    icon: React.ReactNode;
    bg: string;
    border: string;
    text: string;
    accent: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-success shrink-0" />,
    bg: "bg-white",
    border: "border-success/30",
    text: "text-gray-900",
    accent: "bg-success",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-danger shrink-0" />,
    bg: "bg-white",
    border: "border-danger/30",
    text: "text-gray-900",
    accent: "bg-danger",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-warning shrink-0" />,
    bg: "bg-white",
    border: "border-warning/30",
    text: "text-gray-900",
    accent: "bg-warning",
  },
  info: {
    icon: <Info className="h-5 w-5 text-info shrink-0" />,
    bg: "bg-white",
    border: "border-info/30",
    text: "text-gray-900",
    accent: "bg-info",
  },
  default: {
    icon: <Info className="h-5 w-5 text-primary shrink-0" />,
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    accent: "bg-primary",
  },
};

export const ToastItem: React.FC<ToastItemProps> = ({
  toast: item,
  onDismiss,
  className,
}) => {
  const style = toastTypeStyles[item.type] || toastTypeStyles.default;
  const [isPaused, setIsPaused] = React.useState(false);
  const remainingTimeRef = React.useRef(item.duration ?? 5000);
  const timerStartRef = React.useRef<number>(0);
  const timeoutIdRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss with pause on hover
  React.useEffect(() => {
    if (!item.duration || item.duration === Infinity) return;

    if (!isPaused) {
      timerStartRef.current = Date.now();
      timeoutIdRef.current = setTimeout(() => {
        onDismiss();
      }, remainingTimeRef.current);
    } else {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        const elapsed = Date.now() - timerStartRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      }
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [isPaused, item.duration, onDismiss]);

  const role = item.type === "error" ? "alert" : "status";
  const ariaLive = item.type === "error" ? "assertive" : "polite";

  return (
    <div
      role={role}
      aria-live={ariaLive}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-xl shadow-elevated border transition-all animate-slideUp bg-white",
        style.border,
        className
      )}
    >
      {/* Semantic Left Accent Indicator */}
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)}
        aria-hidden="true"
      />

      {/* Type Icon */}
      <div className="shrink-0 pt-0.5">{style.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h4 className="text-xs font-bold text-gray-900 leading-tight">
            {item.title}
          </h4>
        )}
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">
          {item.message}
        </p>

        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-xs font-bold text-primary hover:text-primary-hover hover:underline inline-flex items-center"
          >
            {item.action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {item.dismissible !== false && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

ToastItem.displayName = "ToastItem";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Toast Container / Toaster
 * ─────────────────────────────────────────────────────────────────────────────
 * Positioned overlay that subscribes to uiStore toasts and renders the stack.
 */

export interface ToastContainerProps {
  /** Screen placement */
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  /** Custom container class */
  className?: string;
}

const positionClasses = {
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "bottom-right",
  className,
}) => {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-3 sm:p-0",
        positionClasses[position],
        className
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <ToastItem
          key={item.id}
          toast={item}
          onDismiss={() => removeToast(item.id)}
        />
      ))}
    </div>
  );
};

ToastContainer.displayName = "ToastContainer";

export { toast };
export default ToastContainer;
