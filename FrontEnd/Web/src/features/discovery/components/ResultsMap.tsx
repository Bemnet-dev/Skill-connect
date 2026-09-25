"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Crosshair,
  Plus,
  Minus,
  Star,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { type WorkerSummary } from "../schema";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ResultsMap Props Interface
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface ResultsMapProps {
  /** Array of worker results to display as interactive pins */
  workers?: WorkerSummary[];
  /** Currently highlighted or selected worker ID */
  selectedWorkerId?: string | null;
  /** Callback fired when a map pin or card popup is selected */
  onSelectWorker?: (worker: WorkerSummary) => void;
  /** Geolocation center coordinates */
  center?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  /** Search radius in kilometers to render boundary radius halo */
  radiusKm?: number;
  /** Loading state while query is fetching */
  isLoading?: boolean;
  /** Optional custom container className */
  className?: string;
  /** Whether the map controls and pins are interactive */
  interactive?: boolean;
}

/**
 * Deterministically computes 2D percentage coordinates on the mock map grid
 * from a worker's ID so pins don't jitter across re-renders.
 */
function getDeterministicPinPosition(workerId: string, index: number) {
  let hash = 0;
  for (let i = 0; i < workerId.length; i++) {
    hash = (hash << 5) - hash + workerId.charCodeAt(i);
    hash |= 0;
  }
  const baseAngle = ((index * 67 + Math.abs(hash) % 360) * Math.PI) / 180;
  const distance = 16 + ((Math.abs(hash) >> 3) % 28); // 16% to 44% from center
  const x = 50 + distance * Math.cos(baseAngle);
  const y = 48 + distance * Math.sin(baseAngle);
  return {
    x: Math.max(10, Math.min(90, x)),
    y: Math.max(14, Math.min(84, y)),
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ResultsMap Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Discovery search results map view. Renders a stylized vector map canvas with:
 * - Animated origin center and search radius perimeter halo
 * - Dynamic interactive worker price/pin markers with hover & active states
 * - Selected worker preview popup card with quick profile actions
 * - Map HUD controls (zoom, recenter, layer toggle, search-as-I-move checkbox)
 * - Provider integration hook point for Mapbox / Google Maps / Leaflet
 */
export function ResultsMap({
  workers = [],
  selectedWorkerId: controlledSelectedWorkerId,
  onSelectWorker,
  center = { latitude: 9.03, longitude: 38.74, address: "Bole, Addis Ababa" },
  radiusKm = 25,
  isLoading = false,
  className,
  interactive = true,
}: ResultsMapProps) {
  const [internalSelectedId, setInternalSelectedId] = React.useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState(13);
  const [searchOnPan, setSearchOnPan] = React.useState(true);

  const activeWorkerId = controlledSelectedWorkerId ?? internalSelectedId;
  const activeWorker = workers.find((w) => w.id === activeWorkerId) || null;

  const handlePinClick = (worker: WorkerSummary) => {
    if (!interactive) return;
    setInternalSelectedId(worker.id);
    onSelectWorker?.(worker);
  };

  return (
    <div
      data-testid="results-map-container"
      className={cn(
        "relative w-full h-[520px] rounded-3xl overflow-hidden border border-gray-200/90 bg-[#F4F6F9] select-none shadow-inner",
        className
      )}
    >
      {/* ── 1. Stylized Vector Map Background (Streets, Terrain, Water) ──── */}
      <svg
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 transition-transform duration-200"
        style={{
          transform: `scale(${1 + (zoomLevel - 13) * 0.04})`,
          transformOrigin: "50% 48%",
        }}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 600"
      >
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#E2E7ED"
              strokeWidth="0.8"
            />
          </pattern>
          <radialGradient id="radius-halo" cx="50%" cy="48%" r="40%">
            <stop offset="0%" stopColor="#0A65CC" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#0A65CC" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0A65CC" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base Grid */}
        <rect width="100%" height="100%" fill="url(#map-grid)" />

        {/* Stylized River / Water Feature */}
        <path
          d="M -50 480 Q 250 420, 450 490 T 850 440"
          fill="none"
          stroke="#CBE4FA"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* Arterial Highway / Main Roads */}
        <path
          d="M 120 -50 Q 280 250, 400 300 T 700 650"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="10"
        />
        <path
          d="M 120 -50 Q 280 250, 400 300 T 700 650"
          fill="none"
          stroke="#E2E7EE"
          strokeWidth="12"
        />
        <path
          d="M -50 200 Q 300 220, 500 180 T 850 230"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="8"
        />
        <path
          d="M -50 200 Q 300 220, 500 180 T 850 230"
          fill="none"
          stroke="#E2E7EE"
          strokeWidth="10"
        />

        {/* Secondary Neighborhood Streets */}
        <path
          d="M 220 100 L 580 140 M 350 50 L 320 400 M 480 220 L 680 320 M 150 320 L 420 380"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
        />

        {/* Search Radius Perimeter Halo */}
        <circle cx="400" cy="288" r="230" fill="url(#radius-halo)" />
        <circle
          cx="400"
          cy="288"
          r="230"
          fill="none"
          stroke="#0A65CC"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeOpacity="0.4"
        />
      </svg>

      {/* ── 2. Origin Center Anchor ────────────────────────────────────────── */}
      <div
        className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-10"
        title={center.address || "Search Origin"}
      >
        <span className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" />
          <span className="relative inline-flex h-5 w-5 rounded-full border-2 border-white bg-primary shadow-md items-center justify-center text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </span>
        <span className="mt-1 px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-semibold text-gray-700 shadow-xs border border-gray-200/80 backdrop-blur-xs">
          {center.address ? center.address.split(",")[0] : "Search Center"}
        </span>
      </div>

      {/* ── 3. Interactive Worker Map Pins ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {workers.map((worker, index) => {
          const { x, y } = getDeterministicPinPosition(worker.id, index);
          const isSelected = worker.id === activeWorkerId;
          const displayPrice =
            worker.hourlyRate > 0
              ? `${worker.currency === "ETB" ? "ETB" : "$"}${worker.hourlyRate}`
              : worker.name.split(" ")[0];

          return (
            <div
              key={worker.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20"
            >
              <button
                type="button"
                data-testid={`map-pin-${worker.id}`}
                onClick={() => handlePinClick(worker)}
                aria-label={`Worker ${worker.name}, ${displayPrice}`}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-md transition-all duration-200 cursor-pointer select-none",
                  isSelected
                    ? "bg-brand-navy text-white scale-110 ring-4 ring-primary/30 z-30"
                    : "bg-white text-gray-900 border border-gray-200/90 hover:scale-105 hover:border-primary hover:text-primary"
                )}
              >
                {/* Pin Icon / Category Dot */}
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    worker.availability === "available_now"
                      ? "bg-emerald-500"
                      : isSelected
                      ? "bg-primary-light"
                      : "bg-primary"
                  )}
                />
                <span className="truncate max-w-[80px]">{displayPrice}</span>

                {/* Rating star on hover/selected */}
                {worker.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-500 pl-0.5">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    <span>{worker.rating.toFixed(1)}</span>
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── 4. Selected Worker Preview Card Overlay ─────────────────────────── */}
      {activeWorker && (
        <div
          data-testid="selected-worker-preview"
          className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 bg-white/98 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-200/90 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/workers/${activeWorker.id}`}
                  className="font-bold text-gray-900 hover:text-primary text-sm truncate"
                >
                  {activeWorker.name}
                </Link>
                {activeWorker.isVerified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {activeWorker.headline || activeWorker.category}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setInternalSelectedId(null)}
              aria-label="Close preview"
              className="text-gray-400 hover:text-gray-600 p-1 text-sm font-semibold rounded-md"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{activeWorker.rating > 0 ? activeWorker.rating.toFixed(1) : "New"}</span>
              </span>
              <span>•</span>
              <span>
                {activeWorker.hourlyRate > 0
                  ? `${activeWorker.currency === "ETB" ? "ETB " : "$"}${activeWorker.hourlyRate}/hr`
                  : "Custom"}
              </span>
            </div>

            <Link href={`/workers/${activeWorker.id}`}>
              <Button size="sm" variant="primary" className="h-7 text-xs px-2.5 gap-1">
                <span>View</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── 5. HUD Top Bar: Worker Count & Info ──────────────────────────────── */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <Badge
          variant="navy"
          size="md"
          rounded="pill"
          className="bg-brand-navy/90 backdrop-blur-md shadow-md gap-1.5 text-xs py-1"
        >
          <MapPin className="h-3.5 w-3.5 text-primary-light" />
          <span>
            {workers.length} {workers.length === 1 ? "worker" : "workers"} in {radiusKm}km radius
          </span>
        </Badge>

        {isLoading && (
          <Badge
            variant="warning"
            size="sm"
            rounded="pill"
            className="animate-pulse shadow-sm"
          >
            Updating...
          </Badge>
        )}
      </div>

      {/* ── 6. HUD Right: Zoom & Recenter Controls ─────────────────────────── */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200/90 overflow-hidden flex flex-col">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
            className="p-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors border-b border-gray-100"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoomLevel((z) => Math.max(9, z - 1))}
            className="p-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Recenter map"
          onClick={() => {
            setInternalSelectedId(null);
            setZoomLevel(13);
          }}
          className="p-2 bg-white/95 backdrop-blur-md text-gray-700 hover:bg-gray-100 hover:text-primary rounded-xl shadow-md border border-gray-200/90 transition-colors"
          title="Recenter"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* ── 7. HUD Bottom Right: "Search as I move the map" Toggle ─────────── */}
      <div className="hidden sm:flex absolute bottom-4 right-4 items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-gray-200/80 text-xs font-medium text-gray-700 z-20">
        <input
          id="search-on-pan"
          type="checkbox"
          checked={searchOnPan}
          onChange={(e) => setSearchOnPan(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
        <label htmlFor="search-on-pan" className="cursor-pointer select-none">
          Search as I move the map
        </label>
      </div>

      {/* ── 8. Empty Results Overlay ────────────────────────────────────────── */}
      {workers.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 text-center max-w-xs space-y-2">
            <div className="mx-auto h-10 w-10 rounded-full bg-primary-50 text-primary flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">No Workers in this Area</h4>
            <p className="text-xs text-gray-500">
              Try increasing your search radius or clearing active filters to see available pros.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsMap;
