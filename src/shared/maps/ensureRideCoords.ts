import * as Location from 'expo-location';

import type { MapLatLng } from './map.types';
import { isValidMapCoordinate } from './map.utils';
import { rideCoordsCache } from './rideCoordsCache';

const geocodeAddress = async (address: string): Promise<MapLatLng | null> => {
  const query = address.trim();
  if (query.length < 2) {
    return null;
  }

  try {
    const results = await Location.geocodeAsync(query);
    const first = results[0];
    if (!first) {
      return null;
    }
    const coordinate: MapLatLng = {
      latitude: first.latitude,
      longitude: first.longitude,
    };
    return isValidMapCoordinate(coordinate) ? coordinate : null;
  } catch {
    return null;
  }
};

/**
 * Resolve pickup/drop-off coordinates for a ride.
 * Prefer on-device cache (from publish/booking). If missing, geocode address text
 * and persist so rider My Rides maps can render without inventing placeholders.
 */
export const ensureRideCoords = async (input: {
  rideId: string;
  originAddress?: string | null;
  destinationAddress?: string | null;
  origin?: MapLatLng | null;
  destination?: MapLatLng | null;
}): Promise<{ origin: MapLatLng | null; destination: MapLatLng | null }> => {
  const rideId = input.rideId.trim();
  if (!rideId) {
    return { origin: null, destination: null };
  }

  await rideCoordsCache.hydrate();
  const cached = rideCoordsCache.getSync(rideId);

  let origin =
    (isValidMapCoordinate(input.origin) ? input.origin : null) ??
    (isValidMapCoordinate(cached?.origin) ? cached!.origin! : null);
  let destination =
    (isValidMapCoordinate(input.destination) ? input.destination : null) ??
    (isValidMapCoordinate(cached?.destination) ? cached!.destination! : null);

  const originAddress = input.originAddress?.trim() || cached?.originAddress || '';
  const destinationAddress =
    input.destinationAddress?.trim() || cached?.destinationAddress || '';

  if (!origin && originAddress) {
    origin = await geocodeAddress(originAddress);
  }
  if (!destination && destinationAddress) {
    destination = await geocodeAddress(destinationAddress);
  }

  if (origin || destination) {
    await rideCoordsCache.save({
      rideId,
      origin,
      destination,
      originAddress: originAddress || undefined,
      destinationAddress: destinationAddress || undefined,
    });
  }

  return { origin, destination };
};
