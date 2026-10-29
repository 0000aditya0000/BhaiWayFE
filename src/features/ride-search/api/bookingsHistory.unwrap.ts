import type { BookingHistoryItemDto } from './bookingsHistory.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asTrimmed = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const readBookingId = (record: Record<string, unknown>): string => {
  const nestedBooking = asRecord(record.booking);
  return (
    asTrimmed(record.id) ||
    asTrimmed(record.bookingId) ||
    asTrimmed(record._id) ||
    asTrimmed(nestedBooking?.id) ||
    asTrimmed(nestedBooking?.bookingId)
  );
};

const hasBookingFields = (record: Record<string, unknown>): boolean =>
  Boolean(readBookingId(record)) ||
  typeof record.rideId === 'string' ||
  typeof record.status === 'string' ||
  record.ride != null ||
  record.totalAmount != null;

const withBookingId = (record: Record<string, unknown>): BookingHistoryItemDto => {
  const bookingId = readBookingId(record);
  return {
    ...(record as unknown as BookingHistoryItemDto),
    id: bookingId || asTrimmed(record.id),
  };
};

/**
 * Accept bare DTO or common wrappers: { data }, { booking }, { item }, { result }.
 */
export const unwrapBookingHistoryItem = (payload: unknown): BookingHistoryItemDto => {
  const root = asRecord(payload);
  if (!root) {
    throw new Error('Invalid booking history detail response');
  }

  if (hasBookingFields(root) && (readBookingId(root) || typeof root.status === 'string')) {
    return withBookingId(root);
  }

  for (const key of ['data', 'booking', 'item', 'result', 'history'] as const) {
    const nested = asRecord(root[key]);
    if (!nested) {
      continue;
    }
    if (hasBookingFields(nested)) {
      return withBookingId({
        ...root,
        ...nested,
        id: readBookingId(nested) || readBookingId(root),
      });
    }
  }

  throw new Error(
    `Invalid booking history detail response (${Object.keys(root).join(', ') || 'empty'})`,
  );
};
