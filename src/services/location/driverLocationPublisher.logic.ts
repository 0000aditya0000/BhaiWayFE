/** Pure tracking rules — no React, GPS, or network. Safe for tsx unit tests. */

export const DRIVER_LOCATION_TASK_NAME = 'bhaiway-driver-location';

/** REST backup — keep Redis warm for reconnect / passenger polling. */
export const LOCATION_POST_MIN_MS = 4000;
export const LOCATION_POST_MIN_METERS = 12;
/** Socket.IO primary path (2–4s while moving). */
export const SOCKET_EMIT_MIN_MS = 2500;
export const SOCKET_EMIT_MIN_METERS = 8;
export const RIDE_STATUS_POLL_MS = 5000;
/** Do not POST a buffered fix older than one REST interval as if it were current. */
export const BUFFERED_SAMPLE_MAX_AGE_MS = 12_000;
export const LOCATION_STALE_MS = 45_000;

export const IN_PROGRESS_STATUS = 'IN_PROGRESS';

export type RideLifecycleStatus = string;

export type LocationSample = {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  timestampMs: number;
};

export type LastPublish = {
  at: number;
  coordinate: { latitude: number; longitude: number } | null;
};

export type LocationPermissionKind =
  | 'granted'
  | 'denied'
  | 'denied_forever'
  | 'services_off'
  | 'unavailable'
  | 'pending';

const EARTH_RADIUS_M = 6_371_000;
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const normalizeRideLifecycleStatus = (
  status: string | null | undefined,
): string => String(status ?? '').trim().toUpperCase();

export const isEligibleTrackingStatus = (
  status: string | null | undefined,
): boolean => normalizeRideLifecycleStatus(status) === IN_PROGRESS_STATUS;

export const shouldStopForRideStatus = (
  status: string | null | undefined,
): boolean => TERMINAL_STATUSES.has(normalizeRideLifecycleStatus(status));

/** Live Ride / Pickup unmount must not own GPS lifecycle. */
export const screenUnmountShouldStopTracking = (): boolean => false;

export const returningToLiveRideShouldCreateWatcher = (): boolean => false;

export const shouldReconcileOnAppState = (next: string): boolean => next === 'active';

export const shouldKeepTrackingOnBackground = (next: string): boolean =>
  next === 'background' || next === 'inactive';

export const isValidPublishCoordinate = (value: {
  latitude?: number;
  longitude?: number;
} | null | undefined): boolean => {
  if (!value) {
    return false;
  }
  const { latitude, longitude } = value;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
};

export const haversineMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
};

export const shouldPublishSample = (args: {
  kind: 'socket' | 'rest';
  nowMs: number;
  sample: LocationSample;
  last: LastPublish;
}): boolean => {
  if (!isValidPublishCoordinate(args.sample)) {
    return false;
  }
  const minMs = args.kind === 'socket' ? SOCKET_EMIT_MIN_MS : LOCATION_POST_MIN_MS;
  const minMeters =
    args.kind === 'socket' ? SOCKET_EMIT_MIN_METERS : LOCATION_POST_MIN_METERS;
  const isFirst = args.last.at === 0 || !args.last.coordinate;
  if (isFirst) {
    return true;
  }
  const elapsedOk = args.nowMs - args.last.at >= minMs;
  const movedOk =
    !args.last.coordinate ||
    haversineMeters(args.last.coordinate, args.sample) >= minMeters;
  return elapsedOk || movedOk;
};

export const shouldRetryBufferedSample = (args: {
  sampleTimestampMs: number;
  nowMs: number;
  maxAgeMs?: number;
}): boolean => {
  const age = args.nowMs - args.sampleTimestampMs;
  return age >= 0 && age <= (args.maxAgeMs ?? BUFFERED_SAMPLE_MAX_AGE_MS);
};

export const isNewerLocationTimestamp = (
  nextIso: string | null | undefined,
  currentIso: string | null | undefined,
): boolean => {
  const next = nextIso ? new Date(nextIso).getTime() : Number.NaN;
  const current = currentIso ? new Date(currentIso).getTime() : Number.NaN;
  if (!Number.isFinite(next) && !Number.isFinite(current)) {
    return true;
  }
  if (!Number.isFinite(next)) {
    return !Number.isFinite(current);
  }
  if (!Number.isFinite(current)) {
    return true;
  }
  return next > current;
};

export const pickEligibleDriverRideId = (
  rides: ReadonlyArray<{ id?: string | null; status?: string | null }>,
): string | null => {
  for (const ride of rides) {
    const id = String(ride.id ?? '').trim();
    if (id && isEligibleTrackingStatus(ride.status)) {
      return id;
    }
  }
  return null;
};

export const shouldStartNativeLocationUpdates = (args: {
  platform: string;
  foregroundGranted: boolean;
}): boolean => args.platform !== 'web' && args.foregroundGranted;

export const mapDriverPermissionMessage = (
  kind: LocationPermissionKind,
): string | null => {
  switch (kind) {
    case 'denied':
      return 'BhaiWay needs location access to share your live position with riders during this trip.';
    case 'denied_forever':
      return 'Location is blocked for BhaiWay. Open Settings → Apps → BhaiWay → Permissions and allow Location.';
    case 'services_off':
      return 'Turn on Location services so riders can see your live position during this trip.';
    case 'unavailable':
      return 'GPS is unavailable right now. Trip status still updates, but riders will not see a live map pin.';
    default:
      return null;
  }
};

export const canTrackWithoutAlwaysPermission = (
  foregroundGranted: boolean,
): boolean => foregroundGranted;
