import { ROUTES } from '@/config';

export const RIDER_BOOKED_RIDE_SCREEN = {
  title: 'Ride Details',
  activeLabel: 'Confirmed booking',
  driverSectionLabel: 'Your driver',
  driverSectionSubtitle: 'Contact your driver for pickup coordination.',
  depositLabel: 'Security deposit',
  otpLabel: 'Pickup OTP',
  otpHint: 'Share at pickup',
  loadingLabel: 'Loading booking…',
  errorTitle: 'Unable to load booking',
  errorRetryLabel: 'Try again',
  missingBookingMessage: 'This booking is missing an ID. Go back and try again.',
  cancelRideLabel: 'Cancel Ride',
  coPassengersLabel: 'Co-Passengers',
  coPassengersSubtitle: 'Other confirmed riders on this trip.',
  coPassengersSummary: (count: number) =>
    count === 1 ? '1 other rider on this trip' : `${count} other riders on this trip`,
  emptyCoPassengersTitle: 'No other passengers yet.',
  emptyCoPassengersSubtitle: 'You are the only confirmed rider on this ride so far.',
  preferencesLabel: 'Ride Preferences',
  preferencesSubtitle: 'Preferences set by the driver for this ride.',
  preferencesEmptyLabel: 'No special preferences for this ride.',
  womenOnlyLabel: 'WOMEN ONLY',
} as const;

export const getRiderBookedRidePath = (params: {
  bookingId: string;
  rideId?: string;
  claimId?: string;
}) => ({
  pathname: ROUTES.myRidesRiderBooking,
  params: {
    bookingId: params.bookingId,
    rideId: params.rideId?.trim() || '',
    claimId: params.claimId?.trim() || '',
  },
});
