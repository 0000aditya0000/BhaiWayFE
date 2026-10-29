import type { RideHistoryItemDto } from './ridesHistory.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const hasCoreRideFields = (record: Record<string, unknown>): boolean =>
  typeof record.id === 'string' ||
  typeof record.source === 'string' ||
  typeof record.destination === 'string' ||
  typeof record.status === 'string';

const hasDetailFields = (record: Record<string, unknown>): boolean =>
  record.vehicle != null ||
  record.passengers != null ||
  record.earnings != null ||
  record.earningsBreakdown != null ||
  record.distanceKm != null ||
  record.durationMinutes != null ||
  record.startedAt != null;

/**
 * Merge wrapper + nested detail so top-level ids are kept while richer
 * `data` / `ride` / `item` payloads win for vehicle, passengers, earnings, etc.
 */
const mergeRideHistoryRecords = (
  base: Record<string, unknown>,
  nested: Record<string, unknown> | null,
): Record<string, unknown> => {
  if (!nested) {
    return base;
  }

  const nestedEarnings =
    asRecord(nested.earnings) ??
    asRecord(nested.earningsBreakdown) ??
    null;
  const baseEarnings =
    asRecord(base.earnings) ??
    asRecord(base.earningsBreakdown) ??
    null;

  const preferDefined = (nestedValue: unknown, baseValue: unknown): unknown =>
    nestedValue != null && nestedValue !== '' ? nestedValue : baseValue;

  return {
    ...base,
    ...nested,
    id: preferDefined(nested.id, base.id),
    status: preferDefined(nested.status, base.status),
    rideType: preferDefined(nested.rideType, base.rideType),
    cancelledAt: preferDefined(nested.cancelledAt, base.cancelledAt),
    direction: preferDefined(nested.direction, base.direction),
    seriesId: preferDefined(nested.seriesId, base.seriesId),
    occurrenceDate: preferDefined(nested.occurrenceDate, base.occurrenceDate),
    passengerCount: nested.passengerCount ?? base.passengerCount ?? null,
    vehicle: nested.vehicle ?? base.vehicle ?? null,
    passengers: nested.passengers ?? base.passengers ?? null,
    earnings: nestedEarnings ?? baseEarnings ?? null,
    // Prefer nested trip metrics when present.
    distanceKm: nested.distanceKm ?? base.distanceKm ?? null,
    durationMinutes: nested.durationMinutes ?? base.durationMinutes ?? null,
    startedAt: nested.startedAt ?? base.startedAt ?? null,
    completedAt: nested.completedAt ?? base.completedAt ?? null,
    sourceLatitude: nested.sourceLatitude ?? base.sourceLatitude ?? null,
    sourceLongitude: nested.sourceLongitude ?? base.sourceLongitude ?? null,
    destinationLatitude:
      nested.destinationLatitude ?? base.destinationLatitude ?? null,
    destinationLongitude:
      nested.destinationLongitude ?? base.destinationLongitude ?? null,
    totalEarnings: nested.totalEarnings ?? base.totalEarnings ?? null,
    assuredBonus: nested.assuredBonus ?? base.assuredBonus ?? null,
  };
};

/**
 * Accept bare DTO or common wrappers: { data }, { ride }, { item }, { result }.
 * When the root already has core ride fields but detail lives nested, merge both.
 */
export const unwrapRideHistoryItem = (payload: unknown): RideHistoryItemDto => {
  const root = asRecord(payload);
  if (!root) {
    throw new Error('Invalid ride history detail response');
  }

  let merged: Record<string, unknown> = root;

  for (const key of ['data', 'ride', 'item', 'result', 'history'] as const) {
    const nested = asRecord(root[key]);
    if (!nested) {
      continue;
    }
    if (hasCoreRideFields(nested) || hasDetailFields(nested)) {
      merged = mergeRideHistoryRecords(merged, nested);
    }
  }

  // Normalize earningsBreakdown alias onto `earnings` for mappers.
  if (!asRecord(merged.earnings) && asRecord(merged.earningsBreakdown)) {
    merged = {
      ...merged,
      earnings: merged.earningsBreakdown,
    };
  }

  if (hasCoreRideFields(merged) || hasDetailFields(merged)) {
    return merged as unknown as RideHistoryItemDto;
  }

  throw new Error(
    `Invalid ride history detail response (${Object.keys(root).join(', ') || 'empty'})`,
  );
};

/** GET /rides/history list item: flatten `{ ride, vehicle, earnings }` onto the trip fields. */
export const flattenRideHistoryListItem = (payload: unknown): RideHistoryItemDto => {
  try {
    return unwrapRideHistoryItem(payload);
  } catch {
    const record = asRecord(payload);
    return (record ?? {}) as unknown as RideHistoryItemDto;
  }
};

export const flattenRideHistoryListItems = (
  items: readonly unknown[],
): RideHistoryItemDto[] => items.map((item) => flattenRideHistoryListItem(item));
