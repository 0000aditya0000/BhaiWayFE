import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MapLatLng } from './map.types';
import { isValidMapCoordinate } from './map.utils';

/**
 * On-device cache of ride coordinates.
 * Backend CreateRideDto currently stores source/destination as text only —
 * we keep picker coordinates locally so maps can render without inventing lat/lng.
 */
export interface RideCoordsRecord {
  rideId: string;
  origin?: MapLatLng | null;
  destination?: MapLatLng | null;
  originAddress?: string;
  destinationAddress?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'bhaiway.rideCoords.v1';

let memoryCache: Record<string, RideCoordsRecord> = {};
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

const hydrate = async (): Promise<void> => {
  if (hydrated) {
    return;
  }
  if (hydratePromise) {
    return hydratePromise;
  }
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, RideCoordsRecord>;
        if (parsed && typeof parsed === 'object') {
          memoryCache = parsed;
        }
      }
    } catch {
      memoryCache = {};
    } finally {
      hydrated = true;
      hydratePromise = null;
    }
  })();
  return hydratePromise;
};

const persist = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Non-fatal — memory cache still works for the session.
  }
};

export const rideCoordsCache = {
  hydrate,

  getSync(rideId: string): RideCoordsRecord | null {
    const id = rideId.trim();
    if (!id) {
      return null;
    }
    return memoryCache[id] ?? null;
  },

  async get(rideId: string): Promise<RideCoordsRecord | null> {
    await hydrate();
    return this.getSync(rideId);
  },

  async save(input: {
    rideId: string;
    origin?: MapLatLng | null;
    destination?: MapLatLng | null;
    originAddress?: string;
    destinationAddress?: string;
  }): Promise<void> {
    const rideId = input.rideId.trim();
    if (!rideId) {
      return;
    }
    await hydrate();
    const previous = memoryCache[rideId];
    const origin = isValidMapCoordinate(input.origin)
      ? input.origin
      : isValidMapCoordinate(previous?.origin)
        ? previous!.origin!
        : null;
    const destination = isValidMapCoordinate(input.destination)
      ? input.destination
      : isValidMapCoordinate(previous?.destination)
        ? previous!.destination!
        : null;
    if (!origin && !destination) {
      return;
    }
    memoryCache[rideId] = {
      rideId,
      origin,
      destination,
      originAddress: input.originAddress ?? previous?.originAddress,
      destinationAddress: input.destinationAddress ?? previous?.destinationAddress,
      updatedAt: new Date().toISOString(),
    };
    await persist();
  },
};
