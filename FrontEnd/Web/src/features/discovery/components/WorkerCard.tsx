"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MapPin,
  ShieldCheck,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { type WorkerSummary } from "../schema";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WORKER_CATEGORY_LABELS, WorkerCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WorkerCard Component Props
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface WorkerCardProps {
  /** Worker search result summary item */
  worker: WorkerSummary;
  /** Optional callback fired when the primary action (Book Now / View) is triggered */
  onBook?: (worker: WorkerSummary) => void;
  /** Optional click handler when the card container is selected */
  onClick?: (worker: WorkerSummary) => void;
  /** Optional callback when user toggles bookmark / saved worker */
  onToggleBookmark?: (workerId: string) => void;
  /** Whether the worker is bookmarked by the active customer */
  isBookmarked?: boolean;
  /** Optional custom container className */
  className?: string;
  /** Visual presentation mode: grid card or list row */
  layout?: "grid" | "list";
}

/**
 * Resolves avatar initials fallback from worker name (e.g. "Dawit Haile" -> "DH")
 */
function getInitials(name: string): string {
  if (!name) return "W";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Computes availability badge styling and copy
 */
function getAvailabilityMeta(availability?: string, isAvailable?: boolean) {
  if (availability === "available_now" || (isAvailable && !availability)) {
    return {
      label: "Available Now",
      variant: "success" as const,
      dotClass: "bg-emerald-500",
    };
  }
  if (availability === "today") {
    return {
      label: "Available Today",
      variant: "info" as const,
      dotClass: "bg-sky-500",
    };
  }
  if (availability === "schedule_only" || availability === "busy") {
    return {
      label: "Schedule Only",
      variant: "warning" as const,
      dotClass: "bg-amber-500",
    };
  }
  return {
    label: "Offline",
    variant: "secondary" as const,
    dotClass: "bg-gray-400",
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WorkerCard Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary search-result card rendered in discovery listings, worker grids,
 * and search result views:
 * - Avatar with fallback initials & real-time presence dot
 * - Name with profile navigation link
 * - Star rating & total review count
 * - Distance indicator (e.g. "3.4 km away") and city/neighborhood label
 * - Availability badge with pulsing status dot
 * - Verification-tier badge ("Verified Pro" / custom tier)
 * - Skills tags & pricing
 * - Call-to-action button ("View Profile" / "Book Now")
 */
export function WorkerCard({
  worker,
  onBook,
  onClick,
  onToggleBookmark,
  isBookmarked = false,
  className,
  layout = "list",
}: WorkerCardProps) {
  const [imageError, setImageError] = React.useState(false);

  const profileHref = `/workers/${worker.id}`;
  const avatarSrc = !imageError ? worker.avatarUrl || worker.image : null;

  // Category display formatting
  const categoryLabel =
    WORKER_CATEGORY_LABELS[worker.category as WorkerCategory] ||
    worker.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Distance computation
  const rawDistance = worker.distanceKm ?? worker.distance;
  const distanceFormatted =
    typeof rawDistance === "number" && !isNaN(rawDistance)
      ? `${rawDistance < 1 ? "< 1" : rawDistance.toFixed(1)} km away`
      : null;

  // Pricing formatting
  const price = worker.hourlyRate > 0 ? worker.hourlyRate : worker.startingPrice;
  const currencySymbol = worker.currency === "ETB" ? "ETB " : "$";
  const priceText =
    price && price > 0 ? `${currencySymbol}${price}/hr` : "Custom Quote";

  // Availability metadata
  const availability = getAvailabilityMeta(worker.availability, worker.isAvailable);

  // Verification tier badge text
  const verificationTier =
    (worker as Record<string, unknown>).verificationTier as string | undefined ||
    (worker as Record<string, unknown>).tier as string | undefined ||
    (worker.isVerified ? "Verified Pro" : null);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Avoid double navigation if interactive button or bookmark was clicked
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    if (onClick) {
      onClick(worker);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleBookmark?.(worker.id);
  };

  const handleBookClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onBook) {
      e.preventDefault();
      e.stopPropagation();
      onBook(worker);
    }
  };

  return (
    <article
      data-testid={`worker-card-${worker.id}`}
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        layout === "list" && "md:flex-row md:items-center md:gap-6",
        className
      )}
    >
      {/* ── Top Left: Avatar & Primary Details ────────────────────────────── */}
      <div className="flex items-start gap-4 flex-1">
        {/* Avatar Container with Presence Dot */}
        <div className="relative shrink-0">
          <Link
            href={profileHref}
            tabIndex={-1}
            aria-label={`View ${worker.name}'s profile`}
            className="block"
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-gray-100 bg-primary-50 flex items-center justify-center font-semibold text-primary transition-transform group-hover:scale-105">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={worker.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-base tracking-wider">
                  {getInitials(worker.name)}
                </span>
              )}
            </div>
          </Link>

          {/* Status Dot */}
          <span
            className={cn(
              "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
              availability.dotClass
            )}
            title={availability.label}
            aria-label={availability.label}
          />
        </div>

        {/* Worker Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header row: Name, Verified Badge, Bookmark Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Link
                href={profileHref}
                className="font-semibold text-gray-900 hover:text-primary transition-colors text-base truncate"
              >
                {worker.name}
              </Link>

              {/* Verification Tier Badge */}
              {verificationTier && (
                <Badge
                  variant="primary"
                  size="sm"
                  rounded="pill"
                  className="bg-primary-50 text-primary border-primary-200 gap-1 text-[11px] font-semibold py-0.5"
                  title="Identity & Credentials Verified"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{verificationTier}</span>
                </Badge>
              )}

              {/* Featured Badge */}
              {worker.featured && (
                <Badge
                  variant="featured"
                  size="sm"
                  rounded="pill"
                  className="text-[10px] uppercase tracking-wider font-bold py-0.5"
                >
                  Featured
                </Badge>
              )}
            </div>

            {/* Bookmark button */}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={handleBookmarkClick}
                aria-label={isBookmarked ? "Remove from saved workers" : "Save worker"}
                className={cn(
                  "p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors shrink-0",
                  isBookmarked && "text-primary fill-primary"
                )}
              >
                <Bookmark
                  className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")}
                />
              </button>
            )}
          </div>

          {/* Category & Headline */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{categoryLabel}</span>
            {worker.headline && (
              <>
                <span className="text-gray-300">•</span>
                <span className="truncate text-gray-500">{worker.headline}</span>
              </>
            )}
          </div>

          {/* Metrics Row: Rating, Distance, Location, Completed Jobs */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-gray-600">
            {/* Rating */}
            <div
              className="flex items-center gap-1 font-medium text-gray-900"
              aria-label={`Rating: ${worker.rating > 0 ? worker.rating.toFixed(1) : "New"}`}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>{worker.rating > 0 ? worker.rating.toFixed(1) : "New"}</span>
              {worker.reviewCount > 0 && (
                <span className="text-gray-400">({worker.reviewCount})</span>
              )}
            </div>

            {/* Distance */}
            {distanceFormatted && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>{distanceFormatted}</span>
                </div>
              </>
            )}

            {/* Location Label */}
            {worker.location && (
              <>
                <span className="text-gray-300">•</span>
                <span className="truncate text-gray-500">{worker.location}</span>
              </>
            )}

            {/* Completed Jobs */}
            {worker.completedJobsCount > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 text-gray-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>{worker.completedJobsCount} jobs</span>
                </div>
              </>
            )}

            {/* Response Time */}
            {worker.responseTimeMinutes && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>~{worker.responseTimeMinutes}m reply</span>
                </div>
              </>
            )}
          </div>

          {/* Skills Tags */}
          {worker.skills && worker.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {worker.skills.slice(0, 3).map((skill, idx) => (
                <Badge
                  key={`${skill}-${idx}`}
                  variant="secondary"
                  size="sm"
                  rounded="pill"
                  className="bg-gray-100 text-gray-700 border-transparent text-[11px]"
                >
                  {skill}
                </Badge>
              ))}
              {worker.skills.length > 3 && (
                <span className="text-[11px] text-gray-400 font-medium pl-0.5">
                  +{worker.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Right: Price, Availability Badge, Action Buttons ────────── */}
      <div
        className={cn(
          "flex items-center justify-between border-t border-gray-100 pt-4 mt-4 shrink-0",
          layout === "list" &&
            "md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0 md:mt-0 md:border-l md:border-gray-100 md:pl-6 md:min-w-[170px]"
        )}
      >
        {/* Availability Badge & Hourly Rate */}
        <div className={cn("space-y-1", layout === "list" && "md:text-right")}>
          {/* Availability Badge */}
          <Badge
            variant={availability.variant}
            size="sm"
            rounded="pill"
            className="text-[11px] gap-1.5 font-medium"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", availability.dotClass)} />
            <span>{availability.label}</span>
          </Badge>

          {/* Pricing */}
          <div className="pt-0.5">
            <span className="text-base font-bold text-gray-900">{priceText}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className={cn("flex items-center gap-2", layout === "list" && "md:mt-3")}>
          <Link href={profileHref} className="block">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookClick}
              className="gap-1.5 font-semibold text-xs border-primary/30 text-primary hover:bg-primary hover:text-white"
            >
              <span>View Profile</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default WorkerCard;
