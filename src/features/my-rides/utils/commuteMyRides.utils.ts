import type { RideResponseDto } from '@/features/offer-ride/api/rides.types';

import type { HistoryRideItem, UpcomingRideSummary } from '../types';

export const isCommuteApiRideType = (rideType: string | null | undefined): boolean =>
  String(rideType ?? '')
    .trim()
    .toUpperCase() === 'COMMUTE';

export const isCommuteApiRide = (
  ride:
    | Pick<RideResponseDto, 'rideType'>
    | {
        rideType?: string | null;
        ride?: { rideType?: string | null } | null;
      },
): boolean =>
  isCommuteApiRideType(ride.rideType) ||
  isCommuteApiRideType(
    'ride' in ride ? ride.ride?.rideType : undefined,
  );

export const isCommuteApiBooking = (booking: {
  bookingMode?: string | null;
  ride?: { rideType?: string | null } | null;
}): boolean =>
  String(booking.bookingMode ?? '')
    .trim()
    .toUpperCase() === 'COMMUTE' ||
  isCommuteApiRideType(booking.ride?.rideType);

export const isCommuteUpcomingCard = (ride: Pick<UpcomingRideSummary, 'commute'>): boolean =>
  ride.commute === true;

export const isCommuteHistoryCard = (ride: Pick<HistoryRideItem, 'commute'>): boolean =>
  ride.commute === true;

/** Office commute My Rides — only COMMUTE driver rides and passenger bookings. */
export const filterOfficeCommuteDriverRides = <T extends Pick<RideResponseDto, 'rideType'>>(
  rows: readonly T[],
): T[] => rows.filter((row) => isCommuteApiRide(row));

/** Standard outstation My Rides — hide COMMUTE rows. */
export const filterStandardDriverRides = <T extends Pick<RideResponseDto, 'rideType'>>(
  rows: readonly T[],
): T[] => rows.filter((row) => !isCommuteApiRide(row));

export const filterOfficeCommuteBookings = <
  T extends { bookingMode?: string | null; ride?: { rideType?: string | null } | null },
>(
  rows: readonly T[],
): T[] => rows.filter((row) => isCommuteApiBooking(row));

export const filterStandardBookings = <
  T extends { bookingMode?: string | null; ride?: { rideType?: string | null } | null },
>(
  rows: readonly T[],
): T[] => rows.filter((row) => !isCommuteApiBooking(row));
