/** Regular Ride trip lifecycle — live backend contracts. */

export const TRIP_LIFECYCLE_API = {
  startRide: 'POST /rides/:id/start',
  verifyPickup: 'POST /bookings/:id/verify-pickup',
  completeRide: 'POST /rides/:id/complete',
  getRide: 'GET /rides/:id',
  getPublicRide: 'GET /rides/public/:id',
  listDriverBookings: 'GET /bookings/driver/my-rides',
  listMyBookings: 'GET /bookings/my',
  getBooking: 'GET /bookings/:id',
  listMyRides: 'GET /rides/my',
} as const;

export const TRIP_LIFECYCLE_COPY = {
  startFailedTitle: 'Could not start ride',
  otpFailedTitle: 'Could not verify pickup',
  otpInvalidMessage: 'Incorrect OTP. Please ask the rider again.',
  completeFailedTitle: 'Could not complete trip',
  noPassengersTitle: 'No confirmed passengers',
  noPassengersMessage:
    'There are no active bookings for this ride. Opening the active trip screen so you can complete the ride when ready.',
  allPickedUpTitle: 'All passengers picked up',
  allPickedUpMessage: 'Opening the active trip screen.',
} as const;

/** Assured complete can settle deposits/payments beyond the default 15s API timeout. */
export const COMPLETE_RIDE_TIMEOUT_MS = 45_000;

/** Poll active-trip ride status so a late/server-side COMPLETED still advances the driver UI. */
export const ACTIVE_TRIP_STATUS_POLL_MS = 4_000;

export const RIDE_STATUS = {
  PUBLISHED: 'PUBLISHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export const PICKUP_STATUS = {
  WAITING_FOR_PICKUP: 'WAITING_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
} as const;
