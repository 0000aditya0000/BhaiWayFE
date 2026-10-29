import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

import { BHAIWAY_LOCATION_MESSAGES } from './location.messages';
import type { DeviceLocationState, MapLatLng } from './map.types';

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

export interface UseDeviceLocationOptions {
  watch?: boolean;
  distanceIntervalMeters?: number;
  timeIntervalMs?: number;
  enabled?: boolean;
}

export interface UseDeviceLocationResult extends DeviceLocationState {
  requestPermission: () => Promise<boolean>;
  refreshOnce: () => Promise<MapLatLng | null>;
  openSettings: () => void;
}

const initialState: DeviceLocationState = {
  coordinate: null,
  heading: null,
  speed: null,
  permission: 'pending',
  errorMessage: null,
  watching: false,
};

const readHeading = (coords: Location.LocationObjectCoords): number | null => {
  const h = coords.heading;
  return typeof h === 'number' && Number.isFinite(h) && h >= 0 ? h : null;
};

const readSpeed = (coords: Location.LocationObjectCoords): number | null => {
  const s = coords.speed;
  return typeof s === 'number' && Number.isFinite(s) && s >= 0 ? s : null;
};

/**
 * Foreground device GPS for driver active trip / locate-me.
 * Does not invent coordinates. Does not claim live tracking when GPS is unavailable.
 */
export const useDeviceLocation = (
  options: UseDeviceLocationOptions = {},
): UseDeviceLocationResult => {
  const {
    watch = false,
    distanceIntervalMeters = 15,
    timeIntervalMs = 4000,
    enabled = true,
  } = options;

  const [state, setState] = useState<DeviceLocationState>(initialState);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setState((prev) => ({ ...prev, watching: false }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setState((prev) => ({
          ...prev,
          permission: 'services_off',
          errorMessage: BHAIWAY_LOCATION_MESSAGES.servicesOff,
          coordinate: null,
        }));
        return false;
      }

      const existing = await Location.getForegroundPermissionsAsync();
      let status = existing.status;
      let canAskAgain = existing.canAskAgain;

      if (status !== Location.PermissionStatus.GRANTED) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
        canAskAgain = requested.canAskAgain;
      }

      if (status === Location.PermissionStatus.GRANTED) {
        setState((prev) => ({
          ...prev,
          permission: 'granted',
          errorMessage: null,
        }));
        return true;
      }

      const deniedForever =
        status === Location.PermissionStatus.DENIED && canAskAgain === false;

      setState((prev) => ({
        ...prev,
        permission: deniedForever ? 'denied_forever' : 'denied',
        errorMessage: deniedForever
          ? BHAIWAY_LOCATION_MESSAGES.permissionDeniedForever
          : BHAIWAY_LOCATION_MESSAGES.permissionDenied,
        coordinate: null,
      }));
      return false;
    } catch {
      setState((prev) => ({
        ...prev,
        permission: 'unavailable',
        errorMessage: BHAIWAY_LOCATION_MESSAGES.unavailable,
        coordinate: null,
      }));
      return false;
    }
  }, []);

  const refreshOnce = useCallback(async (): Promise<MapLatLng | null> => {
    const granted = await requestPermission();
    if (!granted) {
      return null;
    }

    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        LOCATION_TIMEOUT_MS,
      );
      const coordinate: MapLatLng = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setState((prev) => ({
        ...prev,
        coordinate,
        heading: readHeading(position.coords),
        speed: readSpeed(position.coords),
        permission: 'granted',
        errorMessage: null,
      }));
      return coordinate;
    } catch (error) {
      const timedOut =
        error instanceof Error && error.message.toLowerCase().includes('timed out');
      setState((prev) => ({
        ...prev,
        errorMessage: timedOut
          ? BHAIWAY_LOCATION_MESSAGES.timeout
          : BHAIWAY_LOCATION_MESSAGES.unavailable,
      }));
      return null;
    }
  }, [requestPermission]);

  useEffect(() => {
    if (!enabled) {
      stopWatching();
      return;
    }

    let cancelled = false;

    const start = async () => {
      const granted = await requestPermission();
      if (cancelled || !granted) {
        return;
      }

      await refreshOnce();
      if (cancelled || !watch || Platform.OS === 'web') {
        return;
      }

      try {
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: distanceIntervalMeters,
            timeInterval: timeIntervalMs,
          },
          (position) => {
            if (cancelled) {
              return;
            }
            setState((prev) => ({
              ...prev,
              coordinate: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              heading: readHeading(position.coords),
              speed: readSpeed(position.coords),
              permission: 'granted',
              errorMessage: null,
              watching: true,
            }));
          },
        );
        if (!cancelled) {
          setState((prev) => ({ ...prev, watching: true }));
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            watching: false,
            errorMessage: BHAIWAY_LOCATION_MESSAGES.unavailable,
          }));
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [
    distanceIntervalMeters,
    enabled,
    refreshOnce,
    requestPermission,
    stopWatching,
    timeIntervalMs,
    watch,
  ]);

  return {
    ...state,
    requestPermission,
    refreshOnce,
    openSettings,
  };
};
