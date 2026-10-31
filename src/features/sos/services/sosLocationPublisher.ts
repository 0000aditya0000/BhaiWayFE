import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';

import { driverLocationPublisher } from '@/services/location';
import {
  LOCATION_POST_MIN_MS,
  SOCKET_EMIT_MIN_MS,
  foregroundWatchDistanceInterval,
  isValidPublishCoordinate,
} from '@/services/location/driverLocationPublisher.logic';
import { authSession } from '@/store';

import { publishSosLocation } from '../api/sos.api';
import { sosStore } from '../store/sos.store';
import { SOS_LOCATION_MIN_METERS, SOS_LOCATION_MIN_MS } from '../constants/sos.constants';

type Sample = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestampMs: number;
};

let activeRideId: string | null = null;
let watchSub: Location.LocationSubscription | null = null;
let driverUnsub: (() => void) | null = null;
let appStateSub: { remove: () => void } | null = null;
let startGeneration = 0;
let lastPublishAt = 0;
let lastCoordinate: { latitude: number; longitude: number } | null = null;
let inFlight = false;
let usingDriverWatch = false;

const haversineMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
};

const shouldPublish = (sample: Sample, now: number): boolean => {
  if (!isValidPublishCoordinate(sample)) {
    return false;
  }
  if (!lastCoordinate || lastPublishAt === 0) {
    return true;
  }
  const elapsed = now - lastPublishAt >= SOS_LOCATION_MIN_MS;
  const moved = haversineMeters(lastCoordinate, sample) >= SOS_LOCATION_MIN_METERS;
  return elapsed || moved;
};

const postSample = async (rideId: string, sample: Sample): Promise<void> => {
  if (inFlight || !authSession.isAuthenticated()) {
    return;
  }
  const now = Date.now();
  if (!shouldPublish(sample, now)) {
    return;
  }
  inFlight = true;
  lastPublishAt = now;
  lastCoordinate = { latitude: sample.latitude, longitude: sample.longitude };
  try {
    await publishSosLocation(rideId, {
      latitude: sample.latitude,
      longitude: sample.longitude,
      timestamp: new Date(sample.timestampMs).toISOString(),
      ...(sample.accuracy != null ? { accuracy: sample.accuracy } : {}),
    });
  } catch {
    lastPublishAt = 0;
  } finally {
    inFlight = false;
  }
};

const stopOwnWatch = (): void => {
  watchSub?.remove();
  watchSub = null;
};

const ingest = (rideId: string, sample: Sample): void => {
  if (activeRideId !== rideId) {
    return;
  }
  void postSample(rideId, sample);
};

const startOwnWatch = async (rideId: string, generation: number): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  stopOwnWatch();
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      sosStore.setLastError('GPS is turned off. Your live SOS location cannot be shared.');
      return;
    }
    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;
    if (status !== Location.PermissionStatus.GRANTED) {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }
    if (status !== Location.PermissionStatus.GRANTED) {
      sosStore.setLastError('Location permission denied. Your live SOS location cannot be shared.');
      return;
    }
    watchSub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: foregroundWatchDistanceInterval(Platform.OS),
        timeInterval: Math.max(SOS_LOCATION_MIN_MS, LOCATION_POST_MIN_MS, SOCKET_EMIT_MIN_MS),
      },
      (position) => {
        if (generation !== startGeneration || activeRideId !== rideId) {
          return;
        }
        ingest(rideId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy:
            typeof position.coords.accuracy === 'number' ? position.coords.accuracy : undefined,
          timestampMs:
            typeof position.timestamp === 'number' ? position.timestamp : Date.now(),
        });
      },
    );
    if (generation !== startGeneration) {
      stopOwnWatch();
    }
  } catch {
    if (generation === startGeneration) {
      sosStore.setLastError('Unable to read GPS. Your live SOS location cannot be shared.');
    }
  }
};

const bindDriverPiggyback = (rideId: string): boolean => {
  const snapshot = driverLocationPublisher.getSnapshot();
  if (!snapshot.watching || snapshot.rideId !== rideId || !snapshot.coordinate) {
    return false;
  }
  usingDriverWatch = true;
  driverUnsub?.();
  driverUnsub = driverLocationPublisher.subscribe(() => {
    const next = driverLocationPublisher.getSnapshot();
    if (next.rideId !== rideId || !next.watching) {
      usingDriverWatch = false;
      driverUnsub?.();
      driverUnsub = null;
      if (activeRideId === rideId && !watchSub) {
        void startOwnWatch(rideId, startGeneration);
      }
      return;
    }
    if (!next.coordinate) {
      return;
    }
    ingest(rideId, {
      latitude: next.coordinate.latitude,
      longitude: next.coordinate.longitude,
      timestampMs: Date.now(),
    });
  });
  ingest(rideId, {
    latitude: snapshot.coordinate.latitude,
    longitude: snapshot.coordinate.longitude,
    timestampMs: Date.now(),
  });
  return true;
};

const ensureAppState = (rideId: string, generation: number): void => {
  if (appStateSub) {
    return;
  }
  appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next !== 'active' || activeRideId !== rideId || generation !== startGeneration) {
      return;
    }
    if (!usingDriverWatch && !watchSub) {
      void startOwnWatch(rideId, generation);
    }
  });
};

export const sosLocationPublisher = {
  start: async (rideId: string): Promise<void> => {
    const id = rideId.trim();
    if (!id || !authSession.isAuthenticated()) {
      return;
    }
    if (activeRideId === id && (watchSub || usingDriverWatch)) {
      sosStore.setLocationPublishing(true);
      return;
    }
    await sosLocationPublisher.stop();
    activeRideId = id;
    const generation = ++startGeneration;
    lastPublishAt = 0;
    lastCoordinate = null;
    sosStore.setLocationPublishing(true);
    ensureAppState(id, generation);
    if (bindDriverPiggyback(id)) {
      return;
    }
    usingDriverWatch = false;
    await startOwnWatch(id, generation);
  },

  stop: async (): Promise<void> => {
    startGeneration += 1;
    activeRideId = null;
    usingDriverWatch = false;
    stopOwnWatch();
    driverUnsub?.();
    driverUnsub = null;
    appStateSub?.remove();
    appStateSub = null;
    lastPublishAt = 0;
    lastCoordinate = null;
    sosStore.setLocationPublishing(false);
  },
};
