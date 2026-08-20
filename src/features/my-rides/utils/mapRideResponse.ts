import type { RideResponseDto } from '@/features/offer-ride/api/rides.types';

import { DEFAULT_PROFILE_AVATAR } from '../constants';
import type { HistoryRideItem, UpcomingRideSummary } from '../types';

const FALLBACK_PICKUP = { latitude: 28.5921, longitude: 77.046 } as const;
const FALLBACK_DROPOFF = { latitude: 28.4595, longitude: 77.0266 } as const;

const normalizeStatus = (status: string | undefined): string =>
  String(status ?? '').trim().toUpperCase();

export const isUpcomingRideStatus = (status: string | undefined): boolean => {
  const value = normalizeStatus(status);
  return value === 'PUBLISHED' || value === 'IN_PROGRESS';
};

export const isHistoryRideStatus = (status: string | undefined): boolean => {
  const value = normalizeStatus(status);
  return value === 'COMPLETED' || value === 'CANCELLED';
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
  const seats = Number.isFinite(ride.availableSeats) ? ride.availableSeats : ride.totalSeats;
  const peer = {
    name: 'Pending requests',
    vehicleLabel: `${seats} seat${seats === 1 ? '' : 's'} open`,
    plateNumber: ride.source,
    verified: false,
    avatarUri: DEFAULT_PROFILE_AVATAR,
  };

  return {
    id: ride.id,
    dateLabel: formatRideDateLabel(ride.departureDate, ride.departureTime),
    title: 'Ride Published',
    assured: ride.rideType === 'ASSURED',
    otp: '',
    pickupLabel: ride.source || 'Pickup',
    dropoffLabel: ride.destination || 'Drop-off',
    pickup: { ...FALLBACK_PICKUP },
    dropoff: { ...FALLBACK_DROPOFF },
    peer,
    driver: peer,
    riders: [],
    role: 'driver',
  };
};

export const mapRideResponseToHistory = (ride: RideResponseDto): HistoryRideItem => {
  const upcoming = mapRideResponseToUpcoming(ride);
  const cancelled = normalizeStatus(ride.status) === 'CANCELLED';
  return {
    id: upcoming.id,
    title: cancelled ? 'Ride Cancelled' : 'Trip Completed',
    routeLabel: `${upcoming.pickupLabel} → ${upcoming.dropoffLabel}`,
    dateLabel: upcoming.dateLabel,
    statusLabel: cancelled ? 'Cancelled' : 'Completed',
    pickupLabel: upcoming.pickupLabel,
    dropoffLabel: upcoming.dropoffLabel,
    pickup: upcoming.pickup,
    dropoff: upcoming.dropoff,
    role: 'driver',
  };
};
