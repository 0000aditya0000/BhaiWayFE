import type { BookingResponseDto } from '@/features/ride-search/api';

import { PICKUP_STATUS } from '../constants';
import { filterActiveDriverBookings } from './mapDriverBooking';

const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

/** Booking UUID from driver list rows — some payloads use `bookingId` instead of `id`. */
export const resolveBookingRecordId = (
  booking: BookingResponseDto | Record<string, unknown>,
): string => {
  const record = booking as BookingResponseDto & { bookingId?: string };
  return record.id?.trim() || record.bookingId?.trim() || '';
};

/** Active Regular pickup queue: confirmed/pending bookings sorted by pickupOrder ASC. */
export const buildPickupQueue = (
  bookings: readonly BookingResponseDto[],
): BookingResponseDto[] => {
  const active = filterActiveDriverBookings(bookings);
  return [...active].sort((a, b) => {
    const orderA =
      typeof a.pickupOrder === 'number' && Number.isFinite(a.pickupOrder)
        ? a.pickupOrder
        : Number.MAX_SAFE_INTEGER;
    const orderB =
      typeof b.pickupOrder === 'number' && Number.isFinite(b.pickupOrder)
        ? b.pickupOrder
        : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
};

export const isPickupCompleted = (booking: BookingResponseDto): boolean =>
  normalize(booking.pickupStatus) === PICKUP_STATUS.PICKED_UP;

/** Index of the next passenger still waiting for pickup; -1 when all are PICKED_UP. */
export const findNextPickupIndex = (
  queue: readonly BookingResponseDto[],
): number => queue.findIndex((booking) => !isPickupCompleted(booking));

export const extractPassengerPickupOtp = (
  booking: BookingResponseDto | Record<string, unknown>,
): string => {
  const record = booking as Record<string, unknown>;
  const value = record.pickupOtp;
  if (typeof value === 'string' && /^\d{4}$/.test(value.trim())) {
    return value.trim();
  }
  return '';
};
