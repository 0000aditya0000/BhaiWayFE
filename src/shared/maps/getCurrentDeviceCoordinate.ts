import * as Location from 'expo-location';

import { isValidMapCoordinate } from './map.utils';
import type { MapLatLng } from './map.types';

const LOCATION_TIMEOUT_MS = 12_000;

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

export type CurrentLocationFailureReason = 'permission' | 'services' | 'unavailable';

export type CurrentDeviceCoordinateResult =
  | { ok: true; coordinate: MapLatLng }
  | { ok: false; reason: CurrentLocationFailureReason };

export const CURRENT_LOCATION_ALERTS: Record<
  CurrentLocationFailureReason,
  { title: string; message: string }
> = {
  permission: {
    title: 'Location permission needed',
    message: 'Please allow location access to use your current location.',
  },
  services: {
    title: 'Location is turned off',
    message: 'Turn on Location services to use your current location.',
  },
  unavailable: {
    title: 'Location unavailable',
    message: 'Unable to fetch your current location. Try again.',
  },
};

const toCoordinate = (coords: Location.LocationObjectCoords): MapLatLng | null => {
  const coordinate = {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
  return isValidMapCoordinate(coordinate) ? coordinate : null;
};

/**
 * Safe GPS read for location pickers.
 * Avoids Highest accuracy + system settings dialogs, which can recreate the
 * Android activity and dump the user back to home.
 */
export const getCurrentDeviceCoordinate = async (): Promise<CurrentDeviceCoordinateResult> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return { ok: false, reason: 'services' };
    }

    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;
    if (status !== Location.PermissionStatus.GRANTED) {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }
    if (status !== Location.PermissionStatus.GRANTED) {
      return { ok: false, reason: 'permission' };
    }

    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        }),
        LOCATION_TIMEOUT_MS,
      );
      const coordinate = toCoordinate(position.coords);
      if (coordinate) {
        return { ok: true, coordinate };
      }
    } catch {
      // Fall through to last-known.
    }

    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      const coordinate = lastKnown ? toCoordinate(lastKnown.coords) : null;
      if (coordinate) {
        return { ok: true, coordinate };
      }
    } catch {
      // Ignore.
    }

    return { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
};
