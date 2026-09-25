import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Skeleton Primitive
 * ─────────────────────────────────────────────────────────────────────────────
 * Placeholder loading skeleton primitive with smooth pulsing animation.
 * Used for perceived performance while data is fetching from APIs.
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: "text" | "circular" | "rectangular" | "button";
  /** Optional inline width */
  width?: string | number;
  /** Optional inline height */
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}) => {
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full shrink-0",
    rectangular: "rounded-lg",
    button: "h-10 w-28 rounded-md",
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200/80 transition-colors",
        variantClasses[variant],
        className
      )}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    />
  );
};

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of text lines to render (defaults to 3) */
  lines?: number;
  /** Height of each line */
  lineHeight?: string;
  /** Spacing between lines */
  gap?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  className,
  lines = 3,
  lineHeight = "h-4",
  gap = "space-y-2",
  ...props
}) => {
  return (
    <div className={cn(gap, className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            lineHeight,
            // Vary the width of the last line for realistic paragraph simulation
            index === lines - 1 && lines > 1 ? "w-3/5" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

Skeleton.displayName = "Skeleton";
SkeletonText.displayName = "SkeletonText";

export default Skeleton;
