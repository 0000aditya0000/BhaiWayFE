import type { RideResponseDto } from '@/features/offer-ride/api/rides.types';
import {
  isUpcomingDriverRideStatus,
  mapDriverUpcomingRideTitle,
} from '@/features/offer-ride/utils/mapRideStatusLabel';
import { isValidMapCoordinate, rideCoordsCache } from '@/shared/maps';

import { DEFAULT_PROFILE_AVATAR } from '../constants';
import type { HistoryRideItem, UpcomingRideSummary } from '../types';
import { isCommuteApiRide } from './commuteMyRides.utils';
import { resolveHistoryEndedMs, resolveUpcomingDepartureMs } from './sortMyRides';

const normalizeStatus = (status: string | undefined): string =>
  String(status ?? '').trim().toUpperCase();

export const isUpcomingRideStatus = (status: string | undefined): boolean =>
  isUpcomingDriverRideStatus(status);

export const isHistoryRideStatus = (status: string | undefined): boolean => {
  const value = normalizeStatus(status);
  return value === 'COMPLETED' || value === 'CANCELLED';
};

/** Driver Modify Ride is allowed for Regular and COMMUTE while still PUBLISHED. */
export const canModifyRegularUpcomingRide = (ride: {
  assured?: boolean;
  commute?: boolean;
  rideStatus?: string;
}): boolean => {
  if (ride.assured) {
    return false;
  }
  const status = normalizeStatus(ride.rideStatus);
  if (!status) {
    return true;
  }
  return status === 'PUBLISHED';
};

const formatRideDateLabel = (date: string, time: string): string => {
  const datePart = date.trim();
  const timePart = time.trim();
  const civilDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(datePart);
  const displayDate = civilDate
    ? `${civilDate[3]}/${civilDate[2]}/${civilDate[1]}`
    : datePart;
  return [displayDate, timePart].filter(Boolean).join(', ').toUpperCase() || 'UPCOMING';
};

/** Map GET /rides/my RideResponseDto into a My Rides driver-mode upcoming card. */
export const mapRideResponseToUpcoming = (ride: RideResponseDto): UpcomingRideSummary => {
  const totalSeats = Number.isFinite(ride.totalSeats) ? ride.totalSeats : 0;
  const availableSeats = Number.isFinite(ride.availableSeats)
    ? ride.availableSeats
    : totalSeats;
  const bookedSeats = Math.max(0, totalSeats - availableSeats);
  const peer = {
    name:
      bookedSeats > 0
        ? `${bookedSeats} booked · ${availableSeats} remaining`
        : 'No passengers yet',
    vehicleLabel: `${availableSeats} of ${totalSeats} seat${totalSeats === 1 ? '' : 's'} open`,
    plateNumber: ride.source,
    verified: false,
    avatarUri: DEFAULT_PROFILE_AVATAR,
  };

  const cached = rideCoordsCache.getSync(ride.id);
  const pickup = isValidMapCoordinate(cached?.origin) ? cached!.origin! : null;
  const dropoff = isValidMapCoordinate(cached?.destination) ? cached!.destination! : null;

  const isCommute = isCommuteApiRide(ride);
  const seriesId = ride.seriesId?.trim() || null;
  const direction = ride.direction ?? null;
  const titleBase = mapDriverUpcomingRideTitle(ride);
  const title =
    isCommute && direction === 'RETURN'
      ? `${titleBase} · Return`
      : titleBase;

  return {
    id: ride.id,
    rideId: ride.id,
    rideStatus: ride.status,
    dateLabel: formatRideDateLabel(
      ride.occurrenceDate || ride.departureDate,
      ride.departureTime,
    ),
    title,
    assured: ride.rideType === 'ASSURED',
    commute: isCommute,
    seriesId,
    occurrenceDate: ride.occurrenceDate ?? null,
    direction,
    otp: '',
    pickupLabel: ride.source || 'Pickup',
    dropoffLabel: ride.destination || 'Drop-off',
    pickup,
    dropoff,
    peer,
    driver: peer,
    riders: [],
    role: 'driver',
    totalSeats,
    availableSeats,
    seatsBooked: bookedSeats,
    sortAtMs: resolveUpcomingDepartureMs(ride.departureDate, ride.departureTime),
  };
};

export const mapRideResponseToHistory = (ride: RideResponseDto): HistoryRideItem => {
  const upcoming = mapRideResponseToUpcoming(ride);
  const cancelled = normalizeStatus(ride.status) === 'CANCELLED';
  return {
    id: upcoming.id,
    rideId: upcoming.id,
    title: cancelled ? 'Ride Cancelled' : 'Trip Completed',
    routeLabel: `${upcoming.pickupLabel} → ${upcoming.dropoffLabel}`,
    dateLabel: upcoming.dateLabel,
    statusLabel: cancelled ? 'Cancelled' : 'Completed',
    status: normalizeStatus(ride.status),
    pickupLabel: upcoming.pickupLabel,
    dropoffLabel: upcoming.dropoffLabel,
    pickup: upcoming.pickup,
    dropoff: upcoming.dropoff,
    role: 'driver',
    assured: upcoming.assured,
    commute: upcoming.commute,
    direction: upcoming.direction ?? null,
    seriesId: upcoming.seriesId ?? null,
    occurrenceDate: upcoming.occurrenceDate ?? null,
    sortAtMs: resolveHistoryEndedMs({
      departureDate: ride.departureDate,
      departureTime: ride.departureTime,
      updatedAt: ride.updatedAt,
      createdAt: ride.createdAt,
    }),
  };
};
