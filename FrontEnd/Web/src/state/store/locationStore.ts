import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Location Store Domain Models & Types
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages persisted search location, geolocation coordinates, search radius,
 * and recent location history for finding skilled workers.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SearchLocation {
  /** Detailed street address if available (e.g., "123 Main St, Apt 4B") */
  address?: string;
  /** City or municipality */
  city?: string;
  /** State, province, or region */
  state?: string;
  /** Postal or ZIP code */
  postalCode?: string;
  /** Country code or name (e.g., "US", "ET") */
  country?: string;
  /** Latitude coordinate */
  latitude: number | null;
  /** Longitude coordinate */
  longitude: number | null;
  /** Human-readable display label (e.g., "Seattle, WA" or "Bole, Addis Ababa") */
  formattedAddress: string;
  /** External geocoding provider ID (Google Places, Mapbox, OpenStreetMap) */
  placeId?: string;
  /** Search radius around this location in kilometers */
  radiusKm: number;
  /** Whether the location was derived from the browser's Geolocation API */
  isUsingCurrentLocation: boolean;
}

export interface LocationState {
  /** Currently selected search location */
  location: SearchLocation;
  /** History of recently selected search locations (capped at 5) */
  recentLocations: SearchLocation[];
  /** Whether the persisted store has finished hydrating from localStorage */
  hasHydrated: boolean;
}

export interface LocationActions {
  /** Update the search location with partial or full attributes */
  setLocation: (location: Partial<SearchLocation>) => void;
  /** Quick-set coordinates and optional label */
  setCoordinates: (latitude: number, longitude: number, formattedAddress?: string) => void;
  /** Update search radius in kilometers */
  setRadius: (radiusKm: number) => void;
  /** Set whether using browser's current geolocation */
  setIsUsingCurrentLocation: (isUsing: boolean) => void;
  /** Reset search location back to empty default */
  clearLocation: void | (() => void);
  /** Add a location to recent search history (maintaining uniqueness, capped at 5) */
  addRecentLocation: (location: SearchLocation) => void;
  /** Clear recent locations history */
  clearRecentLocations: () => void;
  /** Set hydration status (used by Next.js hydration helpers) */
  setHasHydrated: (hasHydrated: boolean) => void;
  /** Reset store to initial state */
  resetLocationStore: () => void;
}

export type LocationStore = LocationState & LocationActions;

export const DEFAULT_SEARCH_RADIUS_KM = 25;

export const DEFAULT_SEARCH_LOCATION: SearchLocation = {
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  latitude: null,
  longitude: null,
  formattedAddress: "",
  placeId: undefined,
  radiusKm: DEFAULT_SEARCH_RADIUS_KM,
  isUsingCurrentLocation: false,
};

export const INITIAL_LOCATION_STATE: LocationState = {
  location: DEFAULT_SEARCH_LOCATION,
  recentLocations: [],
  hasHydrated: false,
};

/**
 * Fallback in-memory storage for SSR and non-browser environments.
 */
const memoryStorage: Record<string, string> = {};

const fallbackStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(name);
      } catch {
        return memoryStorage[name] ?? null;
      }
    }
    return memoryStorage[name] ?? null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch {
        memoryStorage[name] = value;
        return;
      }
    }
    memoryStorage[name] = value;
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(name);
        return;
      } catch {
        delete memoryStorage[name];
        return;
      }
    }
    delete memoryStorage[name];
  },
};

export const LOCATION_STORAGE_KEY = "skilld_search_location";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand locationStore Instance
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_LOCATION_STATE,

      setLocation: (partialLocation) => {
        set((state) => {
          const updatedLocation: SearchLocation = {
            ...state.location,
            ...partialLocation,
          };

          // If location has valid coordinates or formatted address, record in recents
          let updatedRecents = state.recentLocations;
          if (
            updatedLocation.formattedAddress &&
            (updatedLocation.latitude !== null || updatedLocation.address)
          ) {
            const filtered = state.recentLocations.filter(
              (item) =>
                item.formattedAddress.toLowerCase() !==
                updatedLocation.formattedAddress.toLowerCase()
            );
            updatedRecents = [updatedLocation, ...filtered].slice(0, 5);
          }

          return {
            location: updatedLocation,
            recentLocations: updatedRecents,
          };
        });
      },

      setCoordinates: (latitude, longitude, formattedAddress) => {
        set((state) => ({
          location: {
            ...state.location,
            latitude,
            longitude,
            formattedAddress:
              formattedAddress ||
              state.location.formattedAddress ||
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          },
        }));
      },

      setRadius: (radiusKm) => {
        set((state) => ({
          location: {
            ...state.location,
            radiusKm: Math.max(1, radiusKm),
          },
        }));
      },

      setIsUsingCurrentLocation: (isUsingCurrentLocation) => {
        set((state) => ({
          location: {
            ...state.location,
            isUsingCurrentLocation,
          },
        }));
      },

      clearLocation: () => {
        set((state) => ({
          location: {
            ...DEFAULT_SEARCH_LOCATION,
            radiusKm: state.location.radiusKm, // Preserve preferred radius
          },
        }));
      },

      addRecentLocation: (locationToAdd) => {
        if (!locationToAdd.formattedAddress) return;
        set((state) => {
          const filtered = state.recentLocations.filter(
            (item) =>
              item.formattedAddress.toLowerCase() !==
              locationToAdd.formattedAddress.toLowerCase()
          );
          return {
            recentLocations: [locationToAdd, ...filtered].slice(0, 5),
          };
        });
      },

      clearRecentLocations: () => {
        set({ recentLocations: [] });
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },

      resetLocationStore: () => {
        set({
          ...INITIAL_LOCATION_STATE,
          hasHydrated: get().hasHydrated,
        });
      },
    }),
    {
      name: LOCATION_STORAGE_KEY,
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        location: state.location,
        recentLocations: state.recentLocations,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Non-Hook Direct Selectors & Helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getLocation = (): SearchLocation => useLocationStore.getState().location;

export const getCoordinates = (): Coordinates | null => {
  const { latitude, longitude } = useLocationStore.getState().location;
  if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
    return { latitude, longitude };
  }
  return null;
};

export const hasValidCoordinates = (): boolean => getCoordinates() !== null;

export const getSearchRadius = (): number => useLocationStore.getState().location.radiusKm;

export const getRecentLocations = (): SearchLocation[] =>
  useLocationStore.getState().recentLocations;

export default useLocationStore;
