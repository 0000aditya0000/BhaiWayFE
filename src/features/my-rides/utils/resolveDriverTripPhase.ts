import type { BookingResponseDto } from '@/features/ride-search/api';

import { PICKUP_STATUS, RIDE_STATUS } from '../constants';
import { buildPickupQueue, findNextPickupIndex, isPickupCompleted } from './pickupQueue';

export type DriverTripPhase =
  | 'WAITING_TO_START'
  | 'PICKUP_PASSENGER'
  | 'ACTIVE_TRIP'
  | 'COMPLETED'
  | 'CANCELLED';

const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

/** Count active passengers still WAITING_FOR_PICKUP (or not yet marked PICKED_UP). */
export const countWaitingForPickup = (
  bookings: readonly BookingResponseDto[],
): number => buildPickupQueue(bookings).filter((booking) => !isPickupCompleted(booking)).length;

/**
 * Resolve driver Regular trip UI phase from backend ride + bookings.
 * Never invent local started / picked-up flags.
 */
export const resolveDriverTripPhase = (
  rideStatus: string | null | undefined,
  bookings: readonly BookingResponseDto[],
): DriverTripPhase => {
  const status = normalize(rideStatus);

  if (status === RIDE_STATUS.CANCELLED) {
    return 'CANCELLED';
  }
  if (status === RIDE_STATUS.COMPLETED) {
    return 'COMPLETED';
  }
  if (status === RIDE_STATUS.PUBLISHED || !status) {
    return 'WAITING_TO_START';
  }
  if (status === RIDE_STATUS.IN_PROGRESS) {
    return countWaitingForPickup(bookings) > 0 ? 'PICKUP_PASSENGER' : 'ACTIVE_TRIP';
  }

  return 'WAITING_TO_START';
};

export const getNextWaitingPickupIndex = (
  bookings: readonly BookingResponseDto[],
): number => findNextPickupIndex(buildPickupQueue(bookings));

export const isWaitingForPickupStatus = (
  pickupStatus: string | null | undefined,
): boolean => {
  const value = normalize(pickupStatus);
  if (!value) {
    return true;
  }
  return value === PICKUP_STATUS.WAITING_FOR_PICKUP;
};
