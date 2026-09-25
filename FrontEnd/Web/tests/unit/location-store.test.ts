/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  useLocationStore,
  getLocation,
  getCoordinates,
  hasValidCoordinates,
  getSearchRadius,
  getRecentLocations,
  DEFAULT_SEARCH_RADIUS_KM,
  DEFAULT_SEARCH_LOCATION,
} from "@/state/store/locationStore";

describe("locationStore (Persisted Search Location)", () => {
  beforeEach(() => {
    useLocationStore.getState().resetLocationStore();
  });

  it("initializes with default search location and radius", () => {
    const location = getLocation();
    expect(location.latitude).toBeNull();
    expect(location.longitude).toBeNull();
    expect(location.formattedAddress).toBe("");
    expect(location.radiusKm).toBe(DEFAULT_SEARCH_RADIUS_KM);
    expect(getRecentLocations()).toEqual([]);
    expect(hasValidCoordinates()).toBe(false);
  });

  it("updates location attributes via setLocation and tracks in recents", () => {
    useLocationStore.getState().setLocation({
      city: "Addis Ababa",
      country: "ET",
      latitude: 9.03,
      longitude: 38.74,
      formattedAddress: "Addis Ababa, Ethiopia",
    });

    const location = getLocation();
    expect(location.city).toBe("Addis Ababa");
    expect(location.country).toBe("ET");
    expect(location.latitude).toBe(9.03);
    expect(location.longitude).toBe(38.74);
    expect(location.formattedAddress).toBe("Addis Ababa, Ethiopia");

    const recents = getRecentLocations();
    expect(recents).toHaveLength(1);
    expect(recents[0].formattedAddress).toBe("Addis Ababa, Ethiopia");
  });

  it("sets coordinates and auto-formats label if omitted", () => {
    useLocationStore.getState().setCoordinates(47.6062, -122.3321);

    expect(hasValidCoordinates()).toBe(true);
    expect(getCoordinates()).toEqual({
      latitude: 47.6062,
      longitude: -122.3321,
    });
    expect(getLocation().formattedAddress).toBe("47.6062, -122.3321");
  });

  it("sets coordinates with custom label", () => {
    useLocationStore.getState().setCoordinates(47.6062, -122.3321, "Downtown Seattle");

    expect(getCoordinates()).toEqual({
      latitude: 47.6062,
      longitude: -122.3321,
    });
    expect(getLocation().formattedAddress).toBe("Downtown Seattle");
  });

  it("enforces minimum radius of 1km", () => {
    useLocationStore.getState().setRadius(50);
    expect(getSearchRadius()).toBe(50);

    useLocationStore.getState().setRadius(0);
    expect(getSearchRadius()).toBe(1);

    useLocationStore.getState().setRadius(-10);
    expect(getSearchRadius()).toBe(1);
  });

  it("toggles isUsingCurrentLocation flag", () => {
    expect(getLocation().isUsingCurrentLocation).toBe(false);

    useLocationStore.getState().setIsUsingCurrentLocation(true);
    expect(getLocation().isUsingCurrentLocation).toBe(true);
  });

  it("clears location but preserves user preferred radius", () => {
    useLocationStore.getState().setLocation({
      city: "Bole",
      latitude: 9.0,
      longitude: 38.7,
      formattedAddress: "Bole, Addis Ababa",
    });
    useLocationStore.getState().setRadius(40);

    useLocationStore.getState().clearLocation?.();

    const location = getLocation();
    expect(location.latitude).toBeNull();
    expect(location.formattedAddress).toBe("");
    expect(location.radiusKm).toBe(40);
  });

  it("limits recent locations to 5 unique entries and moves latest to front", () => {
    const cities = ["City A", "City B", "City C", "City D", "City E", "City F"];
    for (const city of cities) {
      useLocationStore.getState().addRecentLocation({
        ...DEFAULT_SEARCH_LOCATION,
        formattedAddress: city,
      });
    }

    const recents = getRecentLocations();
    expect(recents).toHaveLength(5);
    expect(recents[0].formattedAddress).toBe("City F");
    expect(recents[4].formattedAddress).toBe("City B");

    // Re-adding existing city moves it to top without duplicates
    useLocationStore.getState().addRecentLocation({
      ...DEFAULT_SEARCH_LOCATION,
      formattedAddress: "City C",
    });

    const updatedRecents = getRecentLocations();
    expect(updatedRecents).toHaveLength(5);
    expect(updatedRecents[0].formattedAddress).toBe("City C");

    useLocationStore.getState().clearRecentLocations();
    expect(getRecentLocations()).toEqual([]);
  });
});
