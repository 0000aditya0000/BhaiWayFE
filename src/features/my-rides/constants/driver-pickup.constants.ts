import { ROUTES } from '@/config';

import type { DriverPickupStop, DriverRideKind } from '../types';

export const DRIVER_PICKUP_SCREEN = {
  brandName: 'BhaiWay',
  nextStopLabel: 'Next Stop',
  pickupTitle: (index: number, total: number) => `Pickup ${index} of ${total}`,
  swipeLabel: 'Swipe to Confirm Arrival',
  completedLabel: 'Arrival Confirmed!',
  confirmedTitle: 'Arrival Confirmed',
  confirmedMessage: (name: string) => `Arrival Confirmed for '${name}'`,
  confirmedNextPickupLabel: 'Next Pickup',
  confirmedStartTripLabel: 'Start Trip',
  otpTitle: 'Confirm Pickup OTP',
  otpSubtitle: (name: string) =>
    `Ask ${name} for the 4-digit OTP shown on their app, then enter it below.`,
  otpHint: 'Demo OTP',
  otpConfirmLabel: 'Verify & Continue',
  otpCancelLabel: 'Cancel',
  otpInvalidMessage: 'Incorrect OTP. Please ask the rider again.',
  otpLength: 4,
} as const;

/** Street-level zoom centered on the current pickup pin. */
export const DRIVER_PICKUP_MAP_DELTA = {
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
} as const;

/** Two rider pickups for the driver Start Ride flow. */
export const DEFAULT_DRIVER_PICKUP_STOPS: readonly DriverPickupStop[] = [
  {
    id: 'pickup-1',
    index: 1,
    total: 2,
    passengerName: 'Priya',
    locationLabel: 'Koramangala 5th Block',
    etaLabel: 'Arrival in 3 mins • 0.8 km',
    coordinate: {
      latitude: 12.9352,
      longitude: 77.6245,
    },
    otp: '4821',
  },
  {
    id: 'pickup-2',
    index: 2,
    total: 2,
    passengerName: 'Amit',
    locationLabel: 'Tech Park South Gate',
    etaLabel: 'Arrival in 4 mins • 1.2 km',
    coordinate: {
      latitude: 12.8399,
      longitude: 77.677,
    },
    otp: '7390',
  },
] as const;

export const getDriverPickupPath = (rideType: DriverRideKind = 'assured') => ({
  pathname: ROUTES.myRidesPickup,
  params: { rideType },
});
