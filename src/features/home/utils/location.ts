import * as Location from 'expo-location';

import type { HomeLocation } from '../types';

const LOCATION_TIMEOUT_MS = 8000;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export const resolveUserHomeLocation = async (): Promise<HomeLocation | null> => {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.status !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    const position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      LOCATION_TIMEOUT_MS,
    );

    const places = await withTimeout(
      Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      LOCATION_TIMEOUT_MS,
    );

    const place = places[0];
    if (!place) {
      return null;
    }

    const label =
      place.district ||
      place.name ||
      place.street ||
      place.city ||
      place.subregion ||
      'Current location';

    const city = place.city || place.subregion || place.region || '';

    return {
      label,
      city: city && city !== label ? city : city || label,
    };
  } catch {
    return null;
  }
};
