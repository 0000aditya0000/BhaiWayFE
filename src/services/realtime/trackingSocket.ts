import { io, type Socket } from 'socket.io-client';

import { env } from '@/config';
import { authSession } from '@/store';

import {
  TRACKING_SOCKET_EVENTS,
  type DriverLocationPayload,
  type RideLocationUpdatedPayload,
  type RideTrackingEndedPayload,
  type TrackingConnectionStatus,
  type TrackingErrorPayload,
} from './trackingSocket.types';

type StatusListener = (status: TrackingConnectionStatus) => void;
type LocationListener = (payload: RideLocationUpdatedPayload) => void;
type EndedListener = (payload: RideTrackingEndedPayload) => void;
type ErrorListener = (payload: TrackingErrorPayload) => void;

const TRACKING_NAMESPACE = '/tracking';

/** Remove REST path segments accidentally pasted into a Socket.IO URL. */
const stripAccidentalRestSuffix = (url: string): string =>
  url
    .replace(/\/tracking\/rides(\/.*)?$/i, TRACKING_NAMESPACE)
    .replace(/\/rides(\/.*)?$/i, '');

/**
 * Resolve the Socket.IO namespace URL for Regular Ride tracking.
 * Result always ends with `/tracking` (namespace), never `/tracking/rides/...`.
 *
 * EXPO_PUBLIC_REALTIME_URL may be:
 *   https://api.bhaiway.com/tracking
 * or origin only (we append `/tracking` once).
 */
export const resolveTrackingSocketUrl = (): string => {
  const configured = env.realtimeUrl?.trim();
  let base: string;

  if (configured) {
    base = stripAccidentalRestSuffix(configured.replace(/\/$/, ''));
  } else {
    try {
      const api = new URL(env.apiBaseUrl);
      base = `${api.protocol}//${api.host}`;
    } catch {
      base = stripAccidentalRestSuffix(
        env.apiBaseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, ''),
      );
    }
  }

  if (base.endsWith(TRACKING_NAMESPACE)) {
    return base;
  }
  return `${base}${TRACKING_NAMESPACE}`;
};

const sanitizeTrackingError = (raw: unknown): TrackingErrorPayload => {
  if (typeof raw === 'string' && raw.trim()) {
    return { message: raw.trim() };
  }
  if (raw && typeof raw === 'object') {
    const data = raw as Record<string, unknown>;
    const message =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : 'Tracking connection error';
    const code = typeof data.code === 'string' ? data.code : undefined;
    return { message, code };
  }
  return { message: 'Tracking connection error' };
};

let socket: Socket | null = null;
let activeRideId: string | null = null;
let connectionStatus: TrackingConnectionStatus = 'OFFLINE';
let lastTrackingError: TrackingErrorPayload | null = null;

const statusListeners = new Set<StatusListener>();
const locationListeners = new Set<LocationListener>();
const endedListeners = new Set<EndedListener>();
const errorListeners = new Set<ErrorListener>();

const setStatus = (next: TrackingConnectionStatus): void => {
  if (connectionStatus === next) {
    return;
  }
  connectionStatus = next;
  statusListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // ignore listener errors
    }
  });
};

const emitJoin = (instance: Socket, rideId: string): void => {
  instance.emit(TRACKING_SOCKET_EVENTS.RIDE_JOIN, { rideId });
};

const parseLocationPayload = (raw: unknown): RideLocationUpdatedPayload | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const data = raw as Record<string, unknown>;
  const driverCoordinate =
    data.driverCoordinate && typeof data.driverCoordinate === 'object'
      ? (data.driverCoordinate as Record<string, unknown>)
      : null;
  const nested =
    driverCoordinate ??
    (data.location && typeof data.location === 'object'
      ? (data.location as Record<string, unknown>)
      : data);
  const latitude = Number(nested.latitude ?? nested.lat);
  const longitude = Number(nested.longitude ?? nested.lng ?? nested.lon);
  const rideId = String(data.rideId ?? nested.rideId ?? '');
  if (!rideId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (latitude === 0 && longitude === 0) {
    return null;
  }
  const timestamp =
    typeof nested.timestamp === 'string'
      ? nested.timestamp
      : typeof nested.updatedAt === 'string'
        ? nested.updatedAt
        : typeof data.timestamp === 'string'
          ? data.timestamp
          : typeof data.updatedAt === 'string'
            ? data.updatedAt
            : new Date().toISOString();
  const headingRaw = nested.heading ?? data.heading;
  const speedRaw = nested.speed ?? data.speed;
  return {
    rideId,
    latitude,
    longitude,
    timestamp,
    updatedAt: timestamp,
    heading:
      headingRaw == null || headingRaw === ''
        ? null
        : Number.isFinite(Number(headingRaw))
          ? Number(headingRaw)
          : null,
    speed:
      speedRaw == null || speedRaw === ''
        ? null
        : Number.isFinite(Number(speedRaw))
          ? Number(speedRaw)
          : null,
  };
};

const attachCoreListeners = (instance: Socket): void => {
  instance.on('connect', () => {
    lastTrackingError = null;
    setStatus('CONNECTED');
    if (activeRideId) {
      emitJoin(instance, activeRideId);
    }
  });

  instance.on('disconnect', () => {
    if (connectionStatus !== 'COMPLETED') {
      setStatus('RECONNECTING');
    }
  });

  instance.on('connect_error', (error: Error) => {
    lastTrackingError = { message: error.message || 'Socket connection failed' };
    setStatus('RECONNECTING');
  });

  instance.io.on('reconnect_attempt', () => {
    setStatus('RECONNECTING');
  });

  instance.io.on('reconnect', () => {
    lastTrackingError = null;
    setStatus('CONNECTED');
    if (activeRideId) {
      emitJoin(instance, activeRideId);
    }
  });

  instance.on(TRACKING_SOCKET_EVENTS.RIDE_LOCATION_UPDATED, (raw: unknown) => {
    const payload = parseLocationPayload(raw);
    if (!payload) {
      return;
    }
    if (activeRideId && payload.rideId !== activeRideId) {
      return;
    }
    setStatus('LIVE');
    locationListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });

  instance.on(TRACKING_SOCKET_EVENTS.RIDE_TRACKING_ENDED, (raw: unknown) => {
    const data =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const payload: RideTrackingEndedPayload = {
      rideId: String(data.rideId ?? activeRideId ?? ''),
      reason: typeof data.reason === 'string' ? data.reason : undefined,
      status: typeof data.status === 'string' ? data.status : undefined,
    };
    setStatus('COMPLETED');
    endedListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });

  instance.on(TRACKING_SOCKET_EVENTS.TRACKING_ERROR, (raw: unknown) => {
    const payload = sanitizeTrackingError(raw);
    lastTrackingError = payload;
    setStatus('ERROR');
    if (env.enableLogging) {
      console.log('[LiveLocation][tracking:error]', {
        code: payload.code ?? null,
        message: payload.message,
        rideId: activeRideId,
      });
    }
    errorListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    });
  });
};

const ensureSocket = (): Socket | null => {
  const token = authSession.getToken();
  if (!token) {
    setStatus('OFFLINE');
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    return socket;
  }

  setStatus('CONNECTING');
  const url = resolveTrackingSocketUrl();

  socket = io(url, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
    auth: { token },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  attachCoreListeners(socket);
  return socket;
};

export const trackingSocket = {
  getStatus: (): TrackingConnectionStatus => connectionStatus,

  getLastError: (): TrackingErrorPayload | null => lastTrackingError,

  subscribeStatus: (listener: StatusListener): (() => void) => {
    statusListeners.add(listener);
    listener(connectionStatus);
    return () => {
      statusListeners.delete(listener);
    };
  },

  subscribeLocation: (listener: LocationListener): (() => void) => {
    locationListeners.add(listener);
    return () => {
      locationListeners.delete(listener);
    };
  },

  subscribeEnded: (listener: EndedListener): (() => void) => {
    endedListeners.add(listener);
    return () => {
      endedListeners.delete(listener);
    };
  },

  subscribeError: (listener: ErrorListener): (() => void) => {
    errorListeners.add(listener);
    if (lastTrackingError) {
      listener(lastTrackingError);
    }
    return () => {
      errorListeners.delete(listener);
    };
  },

  /**
   * Connect (or reuse) and join a Regular ride room.
   * Safe to call repeatedly — one socket instance, one listener set.
   */
  joinRide: (rideId: string): void => {
    const id = rideId.trim();
    if (!id) {
      return;
    }
    activeRideId = id;
    const instance = ensureSocket();
    if (!instance) {
      setStatus('OFFLINE');
      return;
    }
    if (instance.connected) {
      emitJoin(instance, id);
      if (connectionStatus !== 'LIVE') {
        setStatus('CONNECTED');
      }
    } else {
      setStatus('CONNECTING');
      instance.connect();
    }
  },

  leaveRide: (rideId?: string): void => {
    const id = (rideId ?? activeRideId)?.trim();
    if (socket && id) {
      socket.emit(TRACKING_SOCKET_EVENTS.RIDE_LEAVE, { rideId: id });
    }
    if (!rideId || rideId === activeRideId) {
      activeRideId = null;
    }
  },

  /** Driver GPS publish — Regular IN_PROGRESS only (caller must gate). */
  emitDriverLocation: (payload: DriverLocationPayload): boolean => {
    const instance = ensureSocket();
    if (!instance?.connected) {
      return false;
    }
    instance.emit(TRACKING_SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
      rideId: payload.rideId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: payload.timestamp ?? new Date().toISOString(),
      ...(payload.heading != null && Number.isFinite(payload.heading)
        ? { heading: payload.heading }
        : {}),
      ...(payload.speed != null && Number.isFinite(payload.speed)
        ? { speed: payload.speed }
        : {}),
    });
    return true;
  },

  disconnect: (): void => {
    activeRideId = null;
    lastTrackingError = null;
    if (socket) {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    setStatus('OFFLINE');
  },

  isConnected: (): boolean => Boolean(socket?.connected),
};
