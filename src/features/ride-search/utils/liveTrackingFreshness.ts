/** Rider-map freshness — no React. Used by Live Tracking UI and tests. */

export const RIDER_LOCATION_STALE_MS = 45_000;

export type RiderLocationFreshness = 'WAITING' | 'LIVE' | 'STALE' | 'UNAVAILABLE';

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

export const classifyRiderLocationFreshness = (args: {
  rideStarted: boolean;
  hasCoordinate: boolean;
  updatedAt: string | null | undefined;
  nowMs: number;
  staleMs?: number;
  trackingError?: string | null;
}): RiderLocationFreshness => {
  if (!args.rideStarted) {
    return 'WAITING';
  }
  if (!args.hasCoordinate) {
    return args.trackingError ? 'UNAVAILABLE' : 'WAITING';
  }
  const stamp = args.updatedAt ? new Date(args.updatedAt).getTime() : Number.NaN;
  if (Number.isFinite(stamp)) {
    const age = args.nowMs - stamp;
    if (age > (args.staleMs ?? RIDER_LOCATION_STALE_MS)) {
      return 'STALE';
    }
  }
  return 'LIVE';
};

export const formatLastLocationReceivedAt = (
  iso: string | null | undefined,
): string | null => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const mm = String(minutes).padStart(2, '0');
  return `Last location received at ${hour12}:${mm} ${ampm}`;
};
