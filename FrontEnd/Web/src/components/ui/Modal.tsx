import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal Primitive
 * ─────────────────────────────────────────────────────────────────────────────
 * Accessible, customizable dialog overlay primitive.
 * Supports compound component pattern (Header, Body, Footer) or direct children.
 * Features body scroll locking, escape key handling, backdrop click, and size presets.
 */

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const modalSizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export interface ModalProps {
  /** Controls visibility of the modal dialog */
  isOpen: boolean;
  /** Callback triggered when the modal requests closure */
  onClose: () => void;
  /** Dialog title (optional if using ModalHeader) */
  title?: string;
  /** Subtitle / description */
  description?: string;
  /** Max-width preset for the modal dialog window */
  size?: ModalSize;
  /** Close modal when clicking on the dimmed backdrop */
  closeOnBackdropClick?: boolean;
  /** Close modal when pressing the Escape key */
  closeOnEscape?: boolean;
  /** Whether to show the top-right 'X' close button */
  showCloseButton?: boolean;
  /** Custom container styling */
  className?: string;
  /** Modal contents */
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  children,
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Handle ESC key to close
  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden transform transition-all duration-200 my-8",
          modalSizeClasses[size],
          className
        )}
      >
        {/* Optional Title Bar when title is passed via props */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-gray-900 leading-6 tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-gray-500 leading-normal">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  className,
  children,
  onClose,
  ...props
}) => (
  <div
    className={cn(
      "flex items-center justify-between p-6 pb-4 border-b border-gray-100",
      className
    )}
    {...props}
  >
    <div className="space-y-1">{children}</div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Close dialog"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

export const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "flex items-center justify-end gap-3 p-6 pt-4 bg-gray-50 border-t border-gray-100",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

Modal.displayName = "Modal";
ModalHeader.displayName = "ModalHeader";
ModalBody.displayName = "ModalBody";
ModalFooter.displayName = "ModalFooter";

export default Modal;
