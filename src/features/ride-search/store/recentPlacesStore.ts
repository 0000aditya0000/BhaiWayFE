import type { PlacesAutocompletePrediction, SelectedDestination } from '../types';

const MAX_RECENT_PLACES = 8;

let recentPlaces: PlacesAutocompletePrediction[] = [];
const recentPlaceDetails = new Map<string, SelectedDestination>();
const listeners = new Set<(places: PlacesAutocompletePrediction[]) => void>();

const notify = () => {
  const snapshot = [...recentPlaces];
  listeners.forEach((listener) => listener(snapshot));
};

const toPrediction = (place: SelectedDestination): PlacesAutocompletePrediction => ({
  placeId: `recent:${place.latitude.toFixed(5)}:${place.longitude.toFixed(5)}`,
  placeName: place.placeName,
  address: place.address,
});

export const recentPlacesStore = {
  get: (): PlacesAutocompletePrediction[] => [...recentPlaces],

  subscribe: (listener: (places: PlacesAutocompletePrediction[]) => void): (() => void) => {
    listeners.add(listener);
    listener([...recentPlaces]);
    return () => {
      listeners.delete(listener);
    };
  },

  add: (place: SelectedDestination) => {
    const placeName = String(place.placeName ?? '').trim();
    if (!placeName) {
      return;
    }

    const next = toPrediction({ ...place, placeName });
    recentPlaces = [next, ...recentPlaces.filter((item) => item.placeId !== next.placeId)].slice(
      0,
      MAX_RECENT_PLACES,
    );
    recentPlaceDetails.set(next.placeId, { ...place });
    notify();
  },
};

export const getRecentPlaceDetails = (placeId: string): SelectedDestination | null =>
  recentPlaceDetails.get(placeId) ?? null;
