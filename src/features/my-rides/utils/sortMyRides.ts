import type { HistoryRideItem, UpcomingRideSummary } from '../types';

export interface HistoryEndedTimestampInput {
  completedAt?: string | null;
  cancelledAt?: string | null;
  dropoffTime?: string | null;
  startedAt?: string | null;
  pickupVerifiedAt?: string | null;
  pickupTime?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

const firstDefinedMs = (candidates: readonly (number | null)[]): number | null => {
  for (const value of candidates) {
    if (value != null && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

/** Parse an ISO / RFC-3339 timestamp. Invalid values return null. */
export const parseIsoTimestampMs = (value?: string | null): number | null => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
};

/**
 * Combine backend civil `YYYY-MM-DD` (or `DD/MM/YYYY`) with `HH:mm` / `HH:mm:ss`
 * using the device local calendar — same convention as publish-ride departure checks.
 */
export const parseCivilDateTimeMs = (
  date?: string | null,
  time?: string | null,
): number | null => {
  const dateRaw = String(date ?? '').trim();
  if (!dateRaw) {
    return null;
  }

  let year: number;
  let month: number;
  let day: number;

  const civil = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateRaw);
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateRaw);
  if (civil) {
    year = Number(civil[1]);
    month = Number(civil[2]);
    day = Number(civil[3]);
  } else if (slash) {
    day = Number(slash[1]);
    month = Number(slash[2]);
    year = Number(slash[3]);
  } else {
    return parseIsoTimestampMs(dateRaw);
  }

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  const timeRaw = String(time ?? '').trim();
  const ampm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(timeRaw);
  const hhmm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeRaw);
  if (ampm) {
    hours = Number(ampm[1]) % 12;
    if (ampm[4].toUpperCase() === 'PM') {
      hours += 12;
    }
    minutes = Number(ampm[2]);
    seconds = Number(ampm[3] ?? 0);
  } else if (hhmm) {
    hours = Number(hhmm[1]);
    minutes = Number(hhmm[2]);
    seconds = Number(hhmm[3] ?? 0);
  }

  const ms = new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const resolveUpcomingDepartureMs = (
  departureDate?: string | null,
  departureTime?: string | null,
): number | null => parseCivilDateTimeMs(departureDate, departureTime);

/**
 * Past-ride sort key: prefer actual completion/end, then cancellation,
 * then other trip timestamps, then scheduled departure, then record timestamps.
 */
export const resolveHistoryEndedMs = (input: HistoryEndedTimestampInput): number | null =>
  firstDefinedMs([
    parseIsoTimestampMs(input.completedAt),
    parseIsoTimestampMs(input.cancelledAt),
    parseIsoTimestampMs(input.dropoffTime),
    parseIsoTimestampMs(input.startedAt),
    parseIsoTimestampMs(input.pickupVerifiedAt),
    parseIsoTimestampMs(input.pickupTime),
    parseCivilDateTimeMs(input.departureDate, input.departureTime),
    parseIsoTimestampMs(input.updatedAt),
    parseIsoTimestampMs(input.createdAt),
  ]);

const compareIds = (a?: string, b?: string): number =>
  String(a ?? '').localeCompare(String(b ?? ''));

const compareByMs = (
  aMs: number | null | undefined,
  bMs: number | null | undefined,
  direction: 'asc' | 'desc',
  aId?: string,
  bId?: string,
): number => {
  const aValid = aMs != null && Number.isFinite(aMs);
  const bValid = bMs != null && Number.isFinite(bMs);
  if (aValid && !bValid) {
    return -1;
  }
  if (!aValid && bValid) {
    return 1;
  }
  if (aValid && bValid && aMs !== bMs) {
    return direction === 'asc' ? aMs - bMs : bMs - aMs;
  }
  return compareIds(aId, bId);
};

/** Upcoming: nearest departure first. Invalid/missing timestamps go last. */
export const sortUpcomingRidesByNearest = <T extends UpcomingRideSummary>(
  rides: readonly T[],
): T[] =>
  [...rides].sort((a, b) =>
    compareByMs(a.sortAtMs, b.sortAtMs, 'asc', a.id, b.id),
  );

/** Past: most recently ended first. Invalid/missing timestamps go last. */
export const sortHistoryRidesByLatest = <T extends HistoryRideItem>(
  rides: readonly T[],
): T[] =>
  [...rides].sort((a, b) =>
    compareByMs(a.sortAtMs, b.sortAtMs, 'desc', a.id, b.id),
  );

/**
 * History APIs paginate without a documented sort param. Re-sort the full
 * accumulated list after each page so order stays consistent as pages load.
 */
export const mergeSortedHistoryRides = (
  current: readonly HistoryRideItem[],
  incoming: readonly HistoryRideItem[],
): HistoryRideItem[] => {
  const byId = new Map<string, HistoryRideItem>();
  for (const item of [...current, ...incoming]) {
    const id = item.id?.trim();
    if (!id) {
      continue;
    }
    byId.set(id, item);
  }
  return sortHistoryRidesByLatest(Array.from(byId.values()));
};
