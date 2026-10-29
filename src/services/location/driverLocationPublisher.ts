import { AppState, Linking, Platform, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { getRideById, listMyRides } from '@/features/offer-ride/api';
import { ENDPOINTS, httpClient } from '@/network';
import { trackingSocket } from '@/services/realtime';
import { authSession } from '@/store';
import type { MapLatLng } from '@/shared/maps';

import {
  DRIVER_LOCATION_TASK_NAME,
  LOCATION_POST_MIN_MS,
  RIDE_STATUS_POLL_MS,
  isEligibleTrackingStatus,
  isValidPublishCoordinate,
  mapDriverPermissionMessage,
  pickEligibleDriverRideId,
  shouldKeepTrackingOnBackground,
  shouldPublishSample,
  shouldReconcileOnAppState,
  shouldRetryBufferedSample,
  shouldStartNativeLocationUpdates,
  shouldStopForRideStatus,
  type LastPublish,
  type LocationPermissionKind,
  type LocationSample,
} from './driverLocationPublisher.logic';

const STORED_RIDE_ID_KEY = 'bhaiway.driverLocation.activeRideId';

export type DriverLocationPublisherSnapshot = {
  rideId: string | null;
  tracking: boolean;
  rideInProgress: boolean;
  coordinate: MapLatLng | null;
  heading: number | null;
  speed: number | null;
  permission: LocationPermissionKind;
  backgroundGranted: boolean;
  errorMessage: string | null;
  watching: boolean;
};

const initialSnapshot: DriverLocationPublisherSnapshot = {
  rideId: null,
  tracking: false,
  rideInProgress: false,
  coordinate: null,
  heading: null,
  speed: null,
  permission: 'pending',
  backgroundGranted: false,
  errorMessage: null,
  watching: false,
};

type NativeLocation = {
  coords: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp?: number;
};

const listeners = new Set<() => void>();
let snapshot: DriverLocationPublisherSnapshot = { ...initialSnapshot };
let startGeneration = 0;
let ensureLock: Promise<void> | null = null;
let watchSub: Location.LocationSubscription | null = null;
let statusTimer: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;
let lastSocket: LastPublish = { at: 0, coordinate: null };
let lastRest: LastPublish = { at: 0, coordinate: null };
let pendingRetry: LocationSample | null = null;
let nativeUpdatesStarted = false;
let restInFlight = false;

const notify = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore subscriber errors
    }
  });
};

const setSnapshot = (partial: Partial<DriverLocationPublisherSnapshot>): void => {
  snapshot = { ...snapshot, ...partial };
  notify();
};

const readHeading = (heading: number | null | undefined): number | null =>
  typeof heading === 'number' && Number.isFinite(heading) && heading >= 0 ? heading : null;

const readSpeed = (speed: number | null | undefined): number | null =>
  typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 ? speed : null;

const toSample = (location: NativeLocation): LocationSample | null => {
  const sample: LocationSample = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    heading: readHeading(location.coords.heading),
    speed: readSpeed(location.coords.speed),
    timestampMs:
      typeof location.timestamp === 'number' && Number.isFinite(location.timestamp)
        ? location.timestamp
        : Date.now(),
  };
  return isValidPublishCoordinate(sample) ? sample : null;
};

const persistRideId = async (rideId: string | null): Promise<void> => {
  try {
    if (!rideId) {
      await AsyncStorage.removeItem(STORED_RIDE_ID_KEY);
      return;
    }
    await AsyncStorage.setItem(STORED_RIDE_ID_KEY, rideId);
  } catch (error) {
    console.log('[LiveLocation][driver] persist rideId failed', error);
  }
};

const readStoredRideId = async (): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(STORED_RIDE_ID_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
};

const isAuthError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return false;
  }
  const status = Number((error as { status?: unknown }).status);
  return status === 401 || status === 403;
};

const isGoneError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return false;
  }
  const status = Number((error as { status?: unknown }).status);
  return status === 404 || status === 409;
};

const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return true;
  }
  const code = 'code' in error ? String((error as { code?: unknown }).code) : '';
  const status = 'status' in error ? Number((error as { status?: unknown }).status) : 0;
  return code === 'NETWORK_ERROR' || code === 'TIMEOUT' || status === 0;
};

const stopWatch = (): void => {
  watchSub?.remove();
  watchSub = null;
};

const stopStatusPoll = (): void => {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
};

const stopNativeUpdates = async (): Promise<void> => {
  if (!nativeUpdatesStarted || Platform.OS === 'web') {
    nativeUpdatesStarted = false;
    return;
  }
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK_NAME);
    if (started) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.log('[LiveLocation][driver] stop native updates failed', error);
  }
  nativeUpdatesStarted = false;
};

const requestForegroundPermission = async (): Promise<boolean> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      setSnapshot({
        permission: 'services_off',
        errorMessage: mapDriverPermissionMessage('services_off'),
        watching: false,
      });
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
      setSnapshot({ permission: 'granted', errorMessage: null });
      return true;
    }

    const deniedForever =
      status === Location.PermissionStatus.DENIED && canAskAgain === false;
    const kind: LocationPermissionKind = deniedForever ? 'denied_forever' : 'denied';
    setSnapshot({
      permission: kind,
      errorMessage: mapDriverPermissionMessage(kind),
      watching: false,
    });
    return false;
  } catch {
    setSnapshot({
      permission: 'unavailable',
      errorMessage: mapDriverPermissionMessage('unavailable'),
      watching: false,
    });
    return false;
  }
};

const requestBackgroundPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const existing = await Location.getBackgroundPermissionsAsync();
    if (existing.status === Location.PermissionStatus.GRANTED) {
      setSnapshot({ backgroundGranted: true });
      return true;
    }
    const requested = await Location.requestBackgroundPermissionsAsync();
    const granted = requested.status === Location.PermissionStatus.GRANTED;
    setSnapshot({ backgroundGranted: granted });
    return granted;
  } catch (error) {
    console.log('[LiveLocation][driver] background permission skipped', error);
    setSnapshot({ backgroundGranted: false });
    return false;
  }
};

const postLocation = async (rideId: string, sample: LocationSample): Promise<void> => {
  if (restInFlight) {
    return;
  }
  if (!shouldRetryBufferedSample({ sampleTimestampMs: sample.timestampMs, nowMs: Date.now() })) {
    pendingRetry = null;
    return;
  }
  restInFlight = true;
  try {
    await httpClient.post(ENDPOINTS.tracking.location(rideId), {
      latitude: sample.latitude,
      longitude: sample.longitude,
    });
    pendingRetry = null;
    console.log('[LiveLocation][driver] posted', {
      rideId,
      latitude: sample.latitude,
      longitude: sample.longitude,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.log('[LiveLocation][driver] post failed', {
      rideId,
      status: error && typeof error === 'object' && 'status' in error ? error.status : undefined,
    });
    if (isAuthError(error)) {
      await driverLocationPublisher.stop('unauthorized');
      return;
    }
    if (isGoneError(error)) {
      void driverLocationPublisher.reconcile();
      return;
    }
    if (isNetworkError(error)) {
      pendingRetry = sample;
    }
  } finally {
    restInFlight = false;
  }
};

const ingestSample = (sample: LocationSample): void => {
  if (!snapshot.rideId || !snapshot.rideInProgress || !snapshot.tracking) {
    return;
  }
  const rideId = snapshot.rideId;
  const now = Date.now();
  setSnapshot({
    coordinate: { latitude: sample.latitude, longitude: sample.longitude },
    heading: sample.heading,
    speed: sample.speed,
    errorMessage: null,
    watching: true,
  });

  if (
    shouldPublishSample({
      kind: 'socket',
      nowMs: now,
      sample,
      last: lastSocket,
    })
  ) {
    lastSocket = {
      at: now,
      coordinate: { latitude: sample.latitude, longitude: sample.longitude },
    };
    const emitted = trackingSocket.emitDriverLocation({
      rideId,
      latitude: sample.latitude,
      longitude: sample.longitude,
      timestamp: new Date(sample.timestampMs).toISOString(),
      heading: sample.heading,
      speed: sample.speed,
    });
    if (emitted) {
      console.log('[LiveLocation][driver] socket emit', {
        rideId,
        latitude: sample.latitude,
        longitude: sample.longitude,
      });
    }
  }

  const restDue = shouldPublishSample({
    kind: 'rest',
    nowMs: now,
    sample,
    last: lastRest,
  });
  const retryDue =
    Boolean(pendingRetry) &&
    shouldRetryBufferedSample({
      sampleTimestampMs: pendingRetry!.timestampMs,
      nowMs: now,
    });

  if (restDue) {
    lastRest = {
      at: now,
      coordinate: { latitude: sample.latitude, longitude: sample.longitude },
    };
    void postLocation(rideId, sample);
    return;
  }

  if (retryDue && pendingRetry) {
    void postLocation(rideId, sample.timestampMs >= pendingRetry.timestampMs ? sample : pendingRetry);
  }
};

const startForegroundWatch = async (generation: number): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  stopWatch();
  try {
    watchSub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 12,
        timeInterval: LOCATION_POST_MIN_MS,
      },
      (position) => {
        if (generation !== startGeneration) {
          return;
        }
        const sample = toSample(position);
        if (sample) {
          ingestSample(sample);
        }
      },
    );
    if (generation === startGeneration) {
      setSnapshot({ watching: true });
    } else {
      stopWatch();
    }
  } catch (error) {
    console.log('[LiveLocation][driver] watchPositionAsync failed', error);
    if (generation === startGeneration) {
      setSnapshot({
        watching: false,
        errorMessage: mapDriverPermissionMessage('unavailable'),
      });
    }
  }
};

const startNativeUpdates = async (): Promise<void> => {
  if (!shouldStartNativeLocationUpdates({
    platform: Platform.OS,
    foregroundGranted: snapshot.permission === 'granted',
  })) {
    return;
  }
  try {
    const already = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK_NAME);
    if (already) {
      nativeUpdatesStarted = true;
      return;
    }
    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_POST_MIN_MS,
      distanceInterval: 12,
      deferredUpdatesInterval: LOCATION_POST_MIN_MS,
      deferredUpdatesDistance: 12,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'BhaiWay trip in progress',
        notificationBody: 'Sharing your live location with riders.',
        notificationColor: '#374BB1',
        killServiceOnDestroy: false,
      },
    });
    nativeUpdatesStarted = true;
  } catch (error) {
    console.log('[LiveLocation][driver] startLocationUpdatesAsync failed', error);
  }
};

const refreshRideStatus = async (rideId: string): Promise<void> => {
  try {
    const ride = await getRideById(rideId);
    const status = ride.status;
    if (shouldStopForRideStatus(status) || !isEligibleTrackingStatus(status)) {
      await driverLocationPublisher.stop(
        shouldStopForRideStatus(status) ? 'completed' : 'not_in_progress',
      );
      return;
    }
    if (!snapshot.rideInProgress) {
      setSnapshot({ rideInProgress: true });
    }
    trackingSocket.joinRide(rideId);
  } catch (error) {
    console.log('[LiveLocation][driver] getRideById failed', error);
    if (isAuthError(error)) {
      await driverLocationPublisher.stop('unauthorized');
    }
  }
};

const startStatusPoll = (rideId: string, generation: number): void => {
  stopStatusPoll();
  void refreshRideStatus(rideId);
  statusTimer = setInterval(() => {
    if (generation !== startGeneration) {
      return;
    }
    void refreshRideStatus(rideId);
  }, RIDE_STATUS_POLL_MS);
};

const ensureAppStateListener = (): void => {
  if (appStateSub) {
    return;
  }
  appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (shouldKeepTrackingOnBackground(next)) {
      return;
    }
    if (!shouldReconcileOnAppState(next)) {
      return;
    }
    if (!snapshot.tracking || !snapshot.rideId) {
      return;
    }
    trackingSocket.joinRide(snapshot.rideId);
    void refreshRideStatus(snapshot.rideId);
    if (!watchSub && snapshot.permission === 'granted') {
      void startForegroundWatch(startGeneration);
      void startNativeUpdates();
    }
    if (pendingRetry && snapshot.rideId) {
      const rideId = snapshot.rideId;
      const sample = pendingRetry;
      if (
        shouldRetryBufferedSample({
          sampleTimestampMs: sample.timestampMs,
          nowMs: Date.now(),
        })
      ) {
        void postLocation(rideId, sample);
      } else {
        pendingRetry = null;
      }
    }
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((position) => {
        const sample = toSample(position);
        if (sample) {
          ingestSample(sample);
        }
      })
      .catch(() => undefined);
  });
};

const startTrackingSession = async (rideId: string, generation: number): Promise<void> => {
  lastSocket = { at: 0, coordinate: null };
  lastRest = { at: 0, coordinate: null };
  pendingRetry = null;
  setSnapshot({
    rideId,
    tracking: true,
    rideInProgress: true,
    errorMessage: snapshot.permission === 'granted' ? null : snapshot.errorMessage,
  });
  await persistRideId(rideId);
  trackingSocket.joinRide(rideId);
  startStatusPoll(rideId, generation);
  ensureAppStateListener();

  const granted = snapshot.permission === 'granted' || (await requestForegroundPermission());
  if (generation !== startGeneration) {
    return;
  }
  if (!granted) {
    return;
  }

  void requestBackgroundPermission();
  await startForegroundWatch(generation);
  if (generation !== startGeneration) {
    return;
  }
  await startNativeUpdates();

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    if (generation !== startGeneration) {
      return;
    }
    const sample = toSample(position);
    if (sample) {
      ingestSample(sample);
    }
  } catch (error) {
    console.log('[LiveLocation][driver] getCurrentPositionAsync failed', error);
  }
};

export const driverLocationPublisher = {
  getSnapshot: (): DriverLocationPublisherSnapshot => snapshot,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  openSettings: (): void => {
    void Linking.openSettings();
  },

  /**
   * Start or reuse tracking for an authorized IN_PROGRESS driver ride.
   * Idempotent for the same rideId — will not stack GPS watchers.
   */
  ensure: async (rideId: string): Promise<void> => {
    const id = rideId.trim();
    if (!id) {
      return;
    }
    if (!authSession.isAuthenticated()) {
      await driverLocationPublisher.stop('logout');
      return;
    }
    if (snapshot.tracking && snapshot.rideId === id) {
      trackingSocket.joinRide(id);
      if (!watchSub && snapshot.permission === 'granted') {
        void startForegroundWatch(startGeneration);
        void startNativeUpdates();
      }
      return;
    }

    const run = async (): Promise<void> => {
      if (snapshot.tracking && snapshot.rideId === id) {
        trackingSocket.joinRide(id);
        if (!watchSub && snapshot.permission === 'granted') {
          void startForegroundWatch(startGeneration);
          void startNativeUpdates();
        }
        return;
      }
      try {
        const ride = await getRideById(id);
        if (!isEligibleTrackingStatus(ride.status)) {
          if (snapshot.rideId === id) {
            await driverLocationPublisher.stop(
              shouldStopForRideStatus(ride.status) ? 'completed' : 'not_in_progress',
            );
          }
          return;
        }
      } catch (error) {
        console.log('[LiveLocation][driver] ensure getRideById failed', error);
        if (isAuthError(error)) {
          await driverLocationPublisher.stop('unauthorized');
        }
        return;
      }

      if (snapshot.tracking && snapshot.rideId && snapshot.rideId !== id) {
        await driverLocationPublisher.stop('replaced');
      }

      const generation = ++startGeneration;
      await startTrackingSession(id, generation);
    };

    const pending = ensureLock ? ensureLock.then(run, run) : run();
    ensureLock = pending.catch(() => undefined);
    await pending;
  },

  stop: async (reason = 'stopped'): Promise<void> => {
    startGeneration += 1;
    const rideId = snapshot.rideId;
    stopWatch();
    stopStatusPoll();
    await stopNativeUpdates();
    if (rideId) {
      trackingSocket.leaveRide(rideId);
    }
    lastSocket = { at: 0, coordinate: null };
    lastRest = { at: 0, coordinate: null };
    pendingRetry = null;
    await persistRideId(null);
    setSnapshot({
      ...initialSnapshot,
      permission: snapshot.permission,
      backgroundGranted: snapshot.backgroundGranted,
    });
    console.log('[LiveLocation][driver] stopped', { reason, rideId });
  },

  /**
   * Reconcile with GET /rides/my. Never restarts from stored rideId alone.
   * Network failures leave an in-flight session running.
   */
  reconcile: async (): Promise<void> => {
    if (!authSession.isAuthenticated()) {
      await driverLocationPublisher.stop('logout');
      return;
    }
    try {
      const rides = await listMyRides();
      const rideId = pickEligibleDriverRideId(rides);
      if (!rideId) {
        if (snapshot.tracking) {
          await driverLocationPublisher.stop('not_in_progress');
        } else {
          await persistRideId(null);
        }
        return;
      }
      await driverLocationPublisher.ensure(rideId);
    } catch (error) {
      console.log('[LiveLocation][driver] reconcile failed', error);
      if (isAuthError(error)) {
        await driverLocationPublisher.stop('unauthorized');
      }
    }
  },

  ingestNative: async (location: NativeLocation): Promise<void> => {
    const sample = toSample(location);
    if (!sample) {
      return;
    }
    if (snapshot.tracking && snapshot.rideInProgress && snapshot.rideId) {
      ingestSample(sample);
      return;
    }
    if (!authSession.getToken()) {
      await authSession.hydrate();
    }
    if (!authSession.isAuthenticated()) {
      return;
    }
    const stored = snapshot.rideId || (await readStoredRideId());
    if (!stored) {
      return;
    }
    await driverLocationPublisher.ensure(stored);
    if (snapshot.tracking && snapshot.rideId === stored) {
      ingestSample(sample);
    }
  },
};
