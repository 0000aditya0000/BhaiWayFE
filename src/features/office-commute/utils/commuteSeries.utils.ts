import type {
  ApiRideDirection,
  ApiSeriesScope,
  ApiWeekday,
  CreateRideDto,
  RideResponseDto,
} from '@/features/offer-ride/api/rides.types';
import { toApiDepartureTime } from '@/features/offer-ride/utils/createRide.mapper';

import { COMMUTE_SERIES_COPY } from '../constants/commute-series.constants';
import type { WeekdayId } from '../types';

export const API_WEEKDAYS: readonly ApiWeekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const WEEKDAY_ID_TO_API: Record<WeekdayId, ApiWeekday> = {
  mon: 'MONDAY',
  tue: 'TUESDAY',
  wed: 'WEDNESDAY',
  thu: 'THURSDAY',
  fri: 'FRIDAY',
  sat: 'SATURDAY',
  sun: 'SUNDAY',
};

export const API_WEEKDAY_TO_ID: Record<ApiWeekday, WeekdayId> = {
  MONDAY: 'mon',
  TUESDAY: 'tue',
  WEDNESDAY: 'wed',
  THURSDAY: 'thu',
  FRIDAY: 'fri',
  SATURDAY: 'sat',
  SUNDAY: 'sun',
};

const WEEKDAY_IDS_BY_JS_DAY: readonly WeekdayId[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

export const PUBLISH_WEEKDAY_REQUIRED_MESSAGE = COMMUTE_SERIES_COPY.publishWeekdayMessage;

export const weekdayIdFromJsDay = (jsDay: number): WeekdayId | null => {
  if (!Number.isInteger(jsDay) || jsDay < 0 || jsDay > 6) {
    return null;
  }
  return WEEKDAY_IDS_BY_JS_DAY[jsDay] ?? null;
};

/** Civil YYYY-MM-DD weekday (calendar date, timezone-independent). */
export const weekdayIdFromCivilDate = (civilYyyyMmDd: string): WeekdayId | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilYyyyMmDd.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  return weekdayIdFromJsDay(new Date(utc).getUTCDay());
};

export const weekdayIdFromDate = (date: Date): WeekdayId | null =>
  weekdayIdFromJsDay(date.getDay());

export const weekdayIdFromSlashDate = (slashDate: string): WeekdayId | null => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(slashDate.trim());
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }
  const civil = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return weekdayIdFromCivilDate(civil);
};

export const excludeWeekdaysFromIncluded = (
  included: readonly WeekdayId[],
): ApiWeekday[] => {
  const selected = new Set(included);
  return API_WEEKDAYS.filter((day) => !selected.has(API_WEEKDAY_TO_ID[day]));
};

export const ensurePublishWeekdayIncluded = (
  selected: readonly WeekdayId[],
  publishWeekday: WeekdayId,
): WeekdayId[] => {
  if (selected.includes(publishWeekday)) {
    return [...selected];
  }
  return [...selected, publishWeekday];
};

export type ToggleRecurringDayResult =
  | { ok: true; next: WeekdayId[]; explainedPublishWeekday: boolean }
  | { ok: false; next: WeekdayId[]; message: string };

export const toggleRecurringDay = (
  selected: readonly WeekdayId[],
  id: WeekdayId,
  publishWeekday: WeekdayId | null,
): ToggleRecurringDayResult => {
  const isSelected = selected.includes(id);
  if (isSelected) {
    if (publishWeekday && id === publishWeekday && selected.length > 1) {
      return {
        ok: false,
        next: [...selected],
        message: PUBLISH_WEEKDAY_REQUIRED_MESSAGE,
      };
    }
    return {
      ok: true,
      next: selected.filter((day) => day !== id),
      explainedPublishWeekday: false,
    };
  }

  let next = [...selected, id];
  let explainedPublishWeekday = false;
  if (publishWeekday && !next.includes(publishWeekday)) {
    next = ensurePublishWeekdayIncluded(next, publishWeekday);
    explainedPublishWeekday = true;
  }
  return { ok: true, next, explainedPublishWeekday };
};

export const minutesFromApiTime = (value: string): number | null => {
  const normalized = toApiDepartureTime(value.trim());
  if (!normalized) {
    return null;
  }
  const [hoursRaw, minutesRaw] = normalized.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

export const isReturnTimeAfterOutbound = (
  outboundTime: string,
  returnTime: string,
): boolean => {
  const outbound = minutesFromApiTime(outboundTime);
  const returning = minutesFromApiTime(returnTime);
  if (outbound == null || returning == null) {
    return false;
  }
  return returning > outbound;
};

export const commutePublishRequiresIdempotency = (
  payload: Pick<CreateRideDto, 'recurring' | 'returnEnabled'>,
): boolean => payload.recurring === true || payload.returnEnabled === true;

export const generateCommutePublishIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `publish-${time}-${random}`;
};

export const fingerprintCreateRidePayload = (payload: CreateRideDto): string =>
  JSON.stringify(payload);

let idempotencyKey: string | null = null;
let idempotencyFingerprint: string | null = null;

export const commutePublishIdempotencyStore = {
  resolve(payload: CreateRideDto): string {
    const fingerprint = fingerprintCreateRidePayload(payload);
    if (idempotencyKey && idempotencyFingerprint === fingerprint) {
      return idempotencyKey;
    }
    idempotencyKey = generateCommutePublishIdempotencyKey();
    idempotencyFingerprint = fingerprint;
    return idempotencyKey;
  },

  peek(): string | null {
    return idempotencyKey;
  },

  clear(): void {
    idempotencyKey = null;
    idempotencyFingerprint = null;
  },
};

export const isAmbiguousPublishNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const record = error as { status?: unknown; code?: unknown };
  const status = typeof record.status === 'number' ? record.status : undefined;
  const code = typeof record.code === 'string' ? record.code.trim().toUpperCase() : '';
  return status === 0 || code === 'TIMEOUT' || code === 'NETWORK_ERROR';
};

export const isReturnRouteSelectionTokenError = (error: unknown): boolean => {
  const text = [
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '',
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '',
  ]
    .join(' ')
    .toLowerCase();
  return (
    text.includes('returnrouteselectiontoken') ||
    text.includes('return route') ||
    text.includes('reverse-route') ||
    text.includes('reverse driving route') ||
    text.includes('reverse-route token')
  );
};

export interface CommutePublishOccurrenceSummary {
  rideId: string;
  seriesId: string | null;
  outboundCount: number;
  returnCount: number;
  occurrenceDates: string[];
  message: string;
}

const uniqueSortedDates = (values: readonly string[]): string[] => {
  const unique = [...new Set(values.filter((value) => value.trim().length > 0))];
  unique.sort();
  return unique;
};

const formatCivilDateShort = (civil: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civil);
  if (!match) {
    return civil;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

export const summarizeCommutePublish = (
  response: RideResponseDto,
): CommutePublishOccurrenceSummary => {
  const nested = response.series?.occurrences;
  const occurrences =
    Array.isArray(nested) && nested.length > 0 ? nested : [response];
  const outbound = occurrences.filter(
    (row) => (row.direction ?? 'OUTBOUND') !== 'RETURN',
  );
  const returning = occurrences.filter((row) => row.direction === 'RETURN');
  const dates = uniqueSortedDates(
    occurrences.map((row) => (row.occurrenceDate || row.departureDate || '').trim()),
  );
  const seriesId = response.seriesId ?? response.series?.id ?? null;

  let message = 'Your commute is now live for others to join.';
  if (occurrences.length > 1 || returning.length > 0) {
    const dateRange =
      dates.length === 1
        ? formatCivilDateShort(dates[0])
        : dates.length > 1
          ? `${formatCivilDateShort(dates[0])}–${formatCivilDateShort(dates[dates.length - 1])}`
          : '';
    const parts = [`Published ${outbound.length} outbound`];
    if (returning.length > 0) {
      parts.push(`and ${returning.length} return`);
    }
    parts.push(outbound.length + returning.length === 1 ? 'ride' : 'rides');
    if (dateRange) {
      parts.push(`(${dateRange})`);
    }
    message = `${parts.join(' ')}.`;
  }

  return {
    rideId: response.id,
    seriesId,
    outboundCount: outbound.length,
    returnCount: returning.length,
    occurrenceDates: dates,
    message,
  };
};

export interface CommuteSeriesCancelIds {
  cancelledRideIds?: readonly string[] | null;
  skippedBookedRideIds?: readonly string[] | null;
  skippedIneligibleRideIds?: readonly string[] | null;
}

export interface CommuteSeriesCancelSummary {
  title: string;
  message: string;
  cancelledCount: number;
  skippedBookedCount: number;
  skippedIneligibleCount: number;
  showSkipAlert: boolean;
}

const uniqueNonEmptyIds = (ids: readonly string[] | null | undefined): string[] => {
  const unique = new Set<string>();
  for (const value of ids ?? []) {
    const id = String(value ?? '').trim();
    if (id) {
      unique.add(id);
    }
  }
  return [...unique];
};

const cancelledRidesSentence = (cancelledCount: number): string => {
  if (cancelledCount > 0) {
    return `${cancelledCount} unbooked ${cancelledCount === 1 ? 'ride was' : 'rides were'} cancelled.`;
  }
  return 'No other rides were cancelled.';
};

/** Derive driver-facing cancel copy from the backend response. Do not assume the whole series was cancelled. */
export const summarizeCommuteSeriesCancel = (
  result: CommuteSeriesCancelIds,
): CommuteSeriesCancelSummary => {
  const cancelledCount = uniqueNonEmptyIds(result.cancelledRideIds).length;
  const skippedBookedCount = uniqueNonEmptyIds(result.skippedBookedRideIds).length;
  const skippedIneligibleCount = uniqueNonEmptyIds(result.skippedIneligibleRideIds).length;
  const showSkipAlert = skippedBookedCount > 0 || skippedIneligibleCount > 0;

  if (!showSkipAlert) {
    return {
      title: COMMUTE_SERIES_COPY.skippedBookedTitle,
      message: '',
      cancelledCount,
      skippedBookedCount,
      skippedIneligibleCount,
      showSkipAlert: false,
    };
  }

  const parts: string[] = [];
  if (skippedBookedCount > 0) {
    parts.push(
      skippedBookedCount === 1
        ? '1 future ride could not be cancelled because it already has bookings'
        : `${skippedBookedCount} future rides could not be cancelled because they already have bookings`,
    );
  }
  if (skippedIneligibleCount > 0) {
    parts.push(
      skippedIneligibleCount === 1
        ? '1 trip was not cancelled because it is already in progress'
        : `${skippedIneligibleCount} trips were not cancelled because they are already in progress`,
    );
  }
  parts.push(cancelledRidesSentence(cancelledCount).replace(/\.$/, ''));

  return {
    title: COMMUTE_SERIES_COPY.skippedBookedTitle,
    message: `${parts.join('. ')}.`,
    cancelledCount,
    skippedBookedCount,
    skippedIneligibleCount,
    showSkipAlert: true,
  };
};

export const isCommuteSeriesRide = (
  ride: Pick<RideResponseDto, 'seriesId'> | { seriesId?: string | null },
): boolean => Boolean(ride.seriesId && String(ride.seriesId).trim());

export const seriesDirectionLabel = (
  direction: ApiRideDirection | string | null | undefined,
): string => (String(direction ?? '').toUpperCase() === 'RETURN' ? 'Return' : 'Outbound');

export const SERIES_SCOPE_THIS: ApiSeriesScope = 'THIS_OCCURRENCE';
export const SERIES_SCOPE_FUTURE: ApiSeriesScope = 'THIS_AND_FUTURE';

/** HTTP 409 COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS — do not retry with another seriesScope. */
export const isCommuteSeriesOccurrenceInProgressError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const record = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
    details?: { code?: unknown; message?: unknown } | null;
  };
  const combined = `${record.code ?? ''} ${record.message ?? ''} ${record.details?.code ?? ''} ${
    record.details?.message ?? ''
  }`.toUpperCase();
  return combined.includes('COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS');
};
