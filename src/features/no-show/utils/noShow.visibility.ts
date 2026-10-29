const upper = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const TERMINAL_RIDE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);
const TERMINAL_BOOKING_STATUSES = new Set(['CANCELLED', 'COMPLETED', 'NO_SHOW']);
const ACTIVE_PASSENGER_BOOKING_STATUSES = new Set([
  'CONFIRMED',
  'ACCEPTED',
  'ACTIVE',
]);
const PICKED_UP_STATUSES = new Set(['PICKED_UP', 'VERIFIED', 'COMPLETED']);

export const isTerminalRideStatus = (status: string | null | undefined): boolean =>
  TERMINAL_RIDE_STATUSES.has(upper(status));

export const isTerminalBookingStatus = (status: string | null | undefined): boolean =>
  TERMINAL_BOOKING_STATUSES.has(upper(status));

export const isActivePassengerBookingStatus = (
  status: string | null | undefined,
): boolean => ACTIVE_PASSENGER_BOOKING_STATUSES.has(upper(status));

export const isPickupCompletedStatus = (status: string | null | undefined): boolean =>
  PICKED_UP_STATUSES.has(upper(status));

export const isPendingNoShowStatus = (status: string | null | undefined): boolean =>
  upper(status) === 'PENDING';

/**
 * Passenger "Report Driver No-Show" — local eligibility only.
 * The 5-minute-after-departure rule is owned by the backend.
 */
export const canPassengerReportDriverNoShow = (input: {
  hasOwnBooking: boolean;
  isRideOwner: boolean;
  bookingStatus?: string | null;
  rideStatus?: string | null;
  pickupStatus?: string | null;
}): boolean => {
  if (!input.hasOwnBooking || input.isRideOwner) {
    return false;
  }
  if (!isActivePassengerBookingStatus(input.bookingStatus)) {
    return false;
  }
  if (isPickupCompletedStatus(input.pickupStatus)) {
    return false;
  }
  if (isTerminalRideStatus(input.rideStatus)) {
    return false;
  }
  return true;
};

/**
 * Driver "Report Passenger No-Show" — targets the current pickup booking.
 */
export const canDriverReportPassengerNoShow = (input: {
  isRideOwner: boolean;
  bookingId?: string | null;
  bookingStatus?: string | null;
  rideStatus?: string | null;
  pickupStatus?: string | null;
}): boolean => {
  if (!input.isRideOwner || !input.bookingId?.trim()) {
    return false;
  }
  if (!isActivePassengerBookingStatus(input.bookingStatus)) {
    return false;
  }
  if (isPickupCompletedStatus(input.pickupStatus)) {
    return false;
  }
  if (isTerminalRideStatus(input.rideStatus) || isTerminalBookingStatus(input.bookingStatus)) {
    return false;
  }
  return true;
};

export const canRespondToNoShowClaim = (input: {
  claimStatus?: string | null;
  currentUserId?: string | null;
  respondentUserId?: string | null;
  claimantUserId?: string | null;
}): boolean => {
  if (!isPendingNoShowStatus(input.claimStatus)) {
    return false;
  }
  const userId = input.currentUserId?.trim();
  const respondentId = input.respondentUserId?.trim();
  const claimantId = input.claimantUserId?.trim();
  if (!userId || !respondentId) {
    return false;
  }
  if (claimantId && userId === claimantId) {
    return false;
  }
  return userId === respondentId;
};
