import { bhaiwayApi } from './apiSlice';

export interface TrackingLocation {
  latitude: number;
  longitude: number;
  updatedAt: string;
  heading?: number | null;
  speed?: number | null;
}

export interface RideTrackingResult {
  rideId: string;
  location: TrackingLocation | null;
  isStale?: boolean;
}

const toFiniteNumber = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : null;
};

const isPlausibleLatLng = (lat: number, lng: number): boolean =>
  !(lat === 0 && lng === 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Pull lat/lng from Nest / Redis / GeoJSON shapes.
 * Backend logs `hasCoordinate=true` — body shape varies by DTO version.
 */
const extractLatLng = (
  value: unknown,
  depth = 0,
): { latitude: number; longitude: number } | null => {
  if (value == null || depth > 5) {
    return null;
  }

  if (Array.isArray(value) && value.length >= 2) {
    const a = Number(value[0]);
    const b = Number(value[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return null;
    }
    // GeoJSON Position is [longitude, latitude]
    if (isPlausibleLatLng(b, a)) {
      return { latitude: b, longitude: a };
    }
    if (isPlausibleLatLng(a, b)) {
      return { latitude: a, longitude: b };
    }
    return null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const o = value as Record<string, unknown>;
  const latitude = toFiniteNumber(
    o.latitude ?? o.lat ?? o.y ?? o.Latitude ?? o.Lat,
  );
  const longitude = toFiniteNumber(
    o.longitude ?? o.lng ?? o.lon ?? o.x ?? o.Longitude ?? o.Lng ?? o.Lon,
  );
  if (latitude != null && longitude != null && isPlausibleLatLng(latitude, longitude)) {
    return { latitude, longitude };
  }

  const nestedKeys = [
    'driverCoordinate',
    'location',
    'coordinate',
    'coordinates',
    'coords',
    'position',
    'geo',
    'point',
    'driverLocation',
    'lastKnownLocation',
    'lastLocation',
    'data',
  ] as const;

  for (const key of nestedKeys) {
    if (key in o) {
      const found = extractLatLng(o[key], depth + 1);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const readUpdatedAt = (...candidates: unknown[]): string => {
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value).toISOString();
    }
  }
  return new Date().toISOString();
};

/** Normalize Nest / alternate DTO shapes into `{ rideId, location }`. */
export const normalizeRideTracking = (
  raw: unknown,
  fallbackRideId: string,
): RideTrackingResult => {
  const root =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);
  const nestedData =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : null;
  const payload = nestedData ?? root;

  const coords = extractLatLng(payload);
  const rideId = String(payload.rideId ?? fallbackRideId);
  const isStale = payload.isStale === true || payload.stale === true;

  const driverNode =
    payload.driverCoordinate && typeof payload.driverCoordinate === 'object'
      ? (payload.driverCoordinate as Record<string, unknown>)
      : null;
  const locationNode =
    payload.location && typeof payload.location === 'object'
      ? (payload.location as Record<string, unknown>)
      : driverNode ?? payload;

  const updatedAt = readUpdatedAt(
    payload.updatedAt,
    payload.updated_at,
    driverNode?.timestamp,
    driverNode?.updatedAt,
    driverNode?.updated_at,
    locationNode.updatedAt,
    locationNode.updated_at,
    locationNode.timestamp,
    payload.timestamp,
  );

  const heading = toFiniteNumber(
    driverNode?.heading ?? locationNode.heading ?? payload.heading,
  );
  const speed = toFiniteNumber(driverNode?.speed ?? locationNode.speed ?? payload.speed);

  if (!coords) {
    console.log('[LiveLocation][tracking] normalize missed coords', {
      rideId,
      keys: Object.keys(payload),
      sample: JSON.stringify(raw)?.slice(0, 400),
    });
    return { rideId, location: null, isStale };
  }

  return {
    rideId,
    isStale,
    location: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      updatedAt,
      heading,
      speed,
    },
  };
};

export const trackingApi = bhaiwayApi.injectEndpoints({
  endpoints: (build) => ({
    getRideTracking: build.query<RideTrackingResult, string>({
      query: (rideId) => `/tracking/rides/${rideId}`,
      transformResponse: (response: unknown, _meta, rideId) =>
        normalizeRideTracking(response, rideId),
      providesTags: (_result, _error, rideId) => [{ type: 'Tracking', id: rideId }],
    }),
    postDriverLocation: build.mutation<
      { ok: boolean; rideId: string; location: TrackingLocation },
      { rideId: string; latitude: number; longitude: number }
    >({
      query: ({ rideId, latitude, longitude }) => ({
        url: `/tracking/rides/${rideId}/location`,
        method: 'POST',
        body: { latitude, longitude },
      }),
      transformResponse: (response: unknown, _meta, arg) => {
        const normalized = normalizeRideTracking(response, arg.rideId);
        return {
          ok: true,
          rideId: normalized.rideId,
          location: normalized.location ?? {
            latitude: arg.latitude,
            longitude: arg.longitude,
            updatedAt: new Date().toISOString(),
          },
        };
      },
      invalidatesTags: (_result, _error, arg) => [{ type: 'Tracking', id: arg.rideId }],
    }),
  }),
});

export const { useGetRideTrackingQuery, usePostDriverLocationMutation } = trackingApi;
