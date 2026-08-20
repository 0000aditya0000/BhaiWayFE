import type { DriverRideKind } from '../types';

export const parseDriverRideKind = (value?: string | null): DriverRideKind =>
  value === 'regular' ? 'regular' : 'assured';

export const isAssuredRide = (rideType: DriverRideKind): boolean => rideType === 'assured';

export const isRegularRide = (rideType: DriverRideKind): boolean => rideType === 'regular';

/** Every ride requires rider OTP verification before the driver can start. */
export const requiresPickupOtp = (_rideType?: DriverRideKind): boolean => true;

export const rideKindFromAssuredFlag = (assured: boolean): DriverRideKind =>
  assured ? 'assured' : 'regular';

export const defaultRideIdForKind = (rideType: DriverRideKind): string =>
  isAssuredRide(rideType) ? 'driving-upcoming-1' : 'driving-upcoming-regular-1';

/** Attach rideType to expo-router path params consistently. */
export const withRideTypeParam = <T extends Record<string, string>>(
  params: T,
  rideType: DriverRideKind,
): T & { rideType: DriverRideKind } => ({
  ...params,
  rideType,
});
