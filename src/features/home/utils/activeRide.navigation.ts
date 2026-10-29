import { ROUTES } from '@/config/screens';
import type { DriverRideKind } from '@/features/my-rides/types';
import type { DriverTripPhase } from '@/features/my-rides/utils/resolveDriverTripPhase';
import type { RideType } from '@/features/ride-search/types';

import type { ActiveRideView } from './activeRide.mapper';

export interface ActiveRideNavigationTarget {
  ok: true;
  pathname: string;
  params: Record<string, string>;
  role: 'DRIVER' | 'PASSENGER';
}

export interface ActiveRideNavigationError {
  ok: false;
  title: string;
  message: string;
}

export type ActiveRideNavigationResult =
  | ActiveRideNavigationTarget
  | ActiveRideNavigationError;

const toDriverRideKind = (rideType: string): DriverRideKind => {
  const value = rideType.trim().toUpperCase();
  if (value === 'ASSURED') {
    return 'assured';
  }
  if (value === 'COMMUTE') {
    return 'commute';
  }
  return 'regular';
};

const toPassengerLiveRideType = (rideType: string): RideType =>
  rideType.trim().toUpperCase() === 'ASSURED' ? 'assured' : 'regular';

export const resolveActiveRideNavigation = (
  ride: Pick<
    ActiveRideView,
    'role' | 'rideId' | 'bookingId' | 'rideType' | 'source' | 'destination'
  >,
  options?: { driverPhase?: DriverTripPhase },
): ActiveRideNavigationResult => {
  const rideId = ride.rideId.trim();
  if (!rideId) {
    return {
      ok: false,
      title: 'Unable to open ride',
      message:
        ride.role === 'PASSENGER'
          ? 'This booking is missing an ID. Pull to refresh and try again.'
          : 'This ride is missing an ID. Pull to refresh and try again.',
    };
  }

  if (ride.role === 'PASSENGER') {
    const bookingId = ride.bookingId?.trim() ?? '';
    if (!bookingId) {
      return {
        ok: false,
        title: 'Unable to open ride',
        message: 'This booking is missing an ID. Pull to refresh and try again.',
      };
    }
    return {
      ok: true,
      role: 'PASSENGER',
      pathname: ROUTES.rideSearchLiveTracking,
      params: {
        rideId,
        bookingId,
        rideType: toPassengerLiveRideType(ride.rideType),
        origin: ride.source,
        destination: ride.destination,
      },
    };
  }

  const driverKind = toDriverRideKind(ride.rideType);
  const useActiveTrip = options?.driverPhase === 'ACTIVE_TRIP';
  return {
    ok: true,
    role: 'DRIVER',
    pathname: useActiveTrip ? ROUTES.myRidesActiveTrip : ROUTES.myRidesPickup,
    params: {
      rideType: driverKind,
      rideId,
      destination: ride.destination,
    },
  };
};
