import type { DriverRideKind, HistoryRideItem, UpcomingRideSummary } from '../types';

export const parseDriverRideKind = (value?: string | null): DriverRideKind => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'commute') {
    return 'commute';
  }
  return normalized === 'regular' ? 'regular' : 'assured';
};

export const isAssuredRide = (rideType: DriverRideKind): boolean => rideType === 'assured';

export const isRegularRide = (rideType: DriverRideKind): boolean => rideType === 'regular';

export const isCommuteRide = (rideType: DriverRideKind): boolean => rideType === 'commute';

/** Every ride requires rider OTP verification before the driver can start. */
export const requiresPickupOtp = (_rideType?: DriverRideKind): boolean => true;

export const rideKindFromAssuredFlag = (assured: boolean): DriverRideKind =>
  assured ? 'assured' : 'regular';

export const resolveDriverRideKindFromCard = (
  ride: Pick<UpcomingRideSummary, 'commute' | 'assured'> | Pick<HistoryRideItem, 'commute' | 'assured'>,
): DriverRideKind => {
  if (ride.commute) {
    return 'commute';
  }
  return rideKindFromAssuredFlag(Boolean(ride.assured));
};

export const defaultRideIdForKind = (rideType: DriverRideKind): string => {
  if (isCommuteRide(rideType)) {
    return 'driving-upcoming-commute-1';
  }
  return isAssuredRide(rideType) ? 'driving-upcoming-1' : 'driving-upcoming-regular-1';
};

/** Attach rideType to expo-router path params consistently. */
export const withRideTypeParam = <T extends Record<string, string>>(
  params: T,
  rideType: DriverRideKind,
): T & { rideType: DriverRideKind } => ({
  ...params,
  rideType,
});
