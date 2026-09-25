"use client";

import * as React from "react";
import Link from "next/link";
import { FolderSearch, LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EmptyState Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Displayed when queries, search filters, lists, or tables yield zero records.
 * Provides helpful guidance and call-to-actions to recover or navigate.
 */

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  icon?: LucideIcon | React.ReactNode;
}

export interface EmptyStateProps {
  /** Optional icon component or custom ReactNode */
  icon?: LucideIcon | React.ReactNode;
  /** Primary title text */
  title: string;
  /** Explanatory description */
  description?: React.ReactNode;
  /** Primary action button configuration or custom element */
  action?: EmptyStateAction | React.ReactNode;
  /** Secondary action configuration or custom element */
  secondaryAction?: EmptyStateAction | React.ReactNode;
  /** Size variant controlling padding and typography */
  size?: "sm" | "md" | "lg";
  /** Optional border styling */
  bordered?: boolean;
  /** Additional custom classNames */
  className?: string;
  /** Custom children rendered beneath actions */
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  bordered = false,
  className,
  children,
}) => {
  const sizeClasses = {
    sm: "py-6 px-4 max-w-sm",
    md: "py-10 px-6 max-w-md",
    lg: "py-16 px-8 max-w-lg",
  };

  const iconSizes = {
    sm: "w-10 h-10 rounded-xl mb-3",
    md: "w-14 h-14 rounded-2xl mb-4",
    lg: "w-16 h-16 rounded-2xl mb-5",
  };

  const titleSizes = {
    sm: "text-base font-bold text-gray-900",
    md: "text-lg sm:text-xl font-bold text-gray-900",
    lg: "text-xl sm:text-2xl font-bold text-gray-900 tracking-tight",
  };

  // Helper to render action button or custom node
  const renderAction = (actionItem: EmptyStateAction | React.ReactNode) => {
    if (!actionItem) return null;

    if (React.isValidElement(actionItem)) {
      return actionItem;
    }

    const { label, onClick, href, variant = "primary", icon: ActionIcon } =
      actionItem as EmptyStateAction;

    let iconElement: React.ReactNode = null;
    if (ActionIcon) {
      if (React.isValidElement(ActionIcon)) {
        iconElement = <span className="mr-2 shrink-0">{ActionIcon}</span>;
      } else {
        const ActionIconComp = ActionIcon as React.ComponentType<{ className?: string }>;
        iconElement = <ActionIconComp className="w-4 h-4 mr-2 shrink-0" />;
      }
    }

    if (href) {
      return (
        <Link
          href={href}
          className={cn(buttonVariants({ variant, size: size === "sm" ? "sm" : "md" }))}
          onClick={onClick}
        >
          {iconElement}
          {label}
        </Link>
      );
    }

    return (
      <Button
        variant={variant}
        size={size === "sm" ? "sm" : "md"}
        onClick={onClick}
      >
        {iconElement}
        {label}
      </Button>
    );
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComponent = Icon as React.ComponentType<{ className?: string }>;
    const iconClass = size === "sm" ? "w-5 h-5" : size === "md" ? "w-7 h-7" : "w-8 h-8";
    return <IconComponent className={iconClass} />;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center mx-auto text-center",
        bordered && "rounded-2xl border border-gray-200/80 bg-white shadow-xs",
        sizeClasses[size],
        className
      )}
    >
      {/* Icon Container */}
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center bg-brand-navy-50/80 border border-brand-navy-100 text-primary shadow-2xs",
            iconSizes[size]
          )}
          aria-hidden="true"
        >
          {renderIcon()}
        </div>
      )}

      {/* Title */}
      <h3 className={titleSizes[size]}>{title}</h3>

      {/* Description */}
      {description && (
        <div className="mt-2 text-sm text-gray-500 leading-relaxed max-w-sm">
          {description}
        </div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && renderAction(action)}
          {secondaryAction && renderAction(secondaryAction)}
        </div>
      )}

      {/* Optional custom children */}
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
export default EmptyState;
