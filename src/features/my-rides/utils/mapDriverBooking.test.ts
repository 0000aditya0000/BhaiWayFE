import { ENDPOINTS } from '../../../network/endpoints';
import type { BookingResponseDto } from '../../ride-search/api/bookings.types';
import {
  buildDriverBookingSubtitle,
  filterActiveDriverBookings,
  filterPendingCommuteBookings,
  formatPaymentMethodLabel,
  groupActiveDriverBookingsByRideId,
  groupPendingCommuteBookingsByRide,
  countPendingCommuteBookingsByRideId,
  mapDriverBookingToConfirmedPassenger,
  mapDriverBookingToPendingRequest,
  mapDriverBookingToRider,
  sumActiveBookedSeats,
} from './mapDriverBooking';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

assertEqual(
  ENDPOINTS.bookings.driverMyRides,
  '/bookings/driver/my-rides',
  'driver my-rides endpoint',
);

assertEqual(formatPaymentMethodLabel('PAY_LATER'), 'Pay After Ride', 'PAY_LATER label');

const booking: BookingResponseDto = {
  id: 'booking-1',
  rideId: 'ride-noida-bareilly',
  passengerId: 'passenger-1',
  seats: 2,
  status: 'CONFIRMED',
  paymentMethod: 'PAY_LATER',
  paymentStatus: 'UNPAID',
  pricePerSeatSnapshot: '120',
  totalAmount: '240',
  bookingMode: 'REGULAR',
  createdAt: '2026-08-21T10:15:00.000Z',
  passenger: {
    id: 'passenger-1',
    displayName: 'Asha Verma',
    profilePhoto: null,
    isVerified: true,
  },
  vehicle: {
    make: 'Tata',
    model: 'Nexon',
  },
};

const cancelled: BookingResponseDto = {
  ...booking,
  id: 'booking-cancelled',
  status: 'CANCELLED',
};

const rider = mapDriverBookingToRider(booking);
assertEqual(rider.name, 'Asha Verma', 'passenger displayName');
assertEqual(rider.seatsBooked, 2, 'seats booked');
assertEqual(rider.verified, true, 'maps isVerified from API');
assertTrue(rider.subtitle?.includes('CONFIRMED') === true, 'subtitle includes status');
assertTrue(
  rider.subtitle?.includes('Pay After Ride') === true,
  'PAY_LATER → Pay After Ride',
);
assertTrue(rider.subtitle?.includes('₹240') === true, 'fare from totalAmount');

const fromFirstName = mapDriverBookingToConfirmedPassenger({
  ...booking,
  passenger: {
    id: 'passenger-1',
    firstName: 'Asha',
    lastName: 'Verma',
    profilePhoto: null,
  },
});
assertEqual(fromFirstName.name, 'Asha Verma', 'firstName + lastName when no displayName');

const confirmed = mapDriverBookingToConfirmedPassenger(booking);
assertEqual(confirmed.bookingStatus, 'CONFIRMED', 'booking status field');
assertEqual(confirmed.paymentStatus, 'UNPAID', 'payment status field');
assertEqual(confirmed.paymentMethodLabel, 'Pay After Ride', 'payment method field');
assertEqual(confirmed.fareTotal, 240, 'fare total without platform fee');
assertEqual(confirmed.callAvailable, false, 'no phone → call unavailable');
assertEqual(
  mapDriverBookingToConfirmedPassenger({
    ...booking,
    passenger: { ...booking.passenger, phone: '9876543210' },
  }).callAvailable,
  true,
  'passenger phone → call available',
);
assertEqual(confirmed.chatAvailable, true, 'chat CTA available for booking conversation resolve');
assertTrue(Boolean(confirmed.bookedAtLabel), 'bookedAt from createdAt');

const withoutPassenger = mapDriverBookingToRider({
  ...booking,
  passenger: null,
});
assertEqual(withoutPassenger.name, 'Passenger', 'fallback when no passenger snapshot');
assertEqual(withoutPassenger.verified, false, 'no invented verification');

assertEqual(filterActiveDriverBookings([booking, cancelled]).length, 1, 'drops CANCELLED');
assertEqual(sumActiveBookedSeats([booking, cancelled]), 2, 'sums active seats only');

const grouped = groupActiveDriverBookingsByRideId([booking, cancelled]);
assertEqual(grouped['ride-noida-bareilly']?.length, 1, 'groups by rideId');
assertEqual(
  buildDriverBookingSubtitle(booking),
  'CONFIRMED · UNPAID · Pay After Ride · ₹240',
  'subtitle composition',
);

const pendingCommute: BookingResponseDto = {
  ...booking,
  id: 'pending-commute-1',
  status: 'PENDING',
  bookingMode: 'COMMUTE',
  seats: 2,
  totalAmount: '220',
  rideId: 'ride-commute-1',
  ride: {
    id: 'ride-commute-1',
    rideType: 'COMMUTE',
    source: 'Sector 62, Noida',
    destination: 'Sector 18, Noida',
    departureDate: '2026-09-03',
    departureTime: '18:30:00',
  },
  passenger: {
    id: 'passenger-rahul',
    displayName: 'Rahul Sharma',
    profilePhoto: 'https://example.com/rahul.jpg',
    isVerified: true,
    averageRating: 4.8,
  } as BookingResponseDto['passenger'],
};

const pendingRegular: BookingResponseDto = {
  ...pendingCommute,
  id: 'pending-regular-1',
  bookingMode: 'REGULAR',
};

const pendingCommuteRide2: BookingResponseDto = {
  ...pendingCommute,
  id: 'pending-commute-2',
  rideId: 'ride-commute-2',
  passenger: {
    id: 'passenger-amit',
    displayName: 'Amit Kumar',
    profilePhoto: null,
  },
  seats: 1,
  totalAmount: '110',
};

assertEqual(filterPendingCommuteBookings([pendingCommute, pendingRegular]).length, 1, 'filters COMMUTE PENDING only');

const pendingRequest = mapDriverBookingToPendingRequest(pendingCommute);
assertEqual(pendingRequest.name, 'Rahul Sharma', 'pending rider name');
assertEqual(pendingRequest.seatsBooked, 2, 'pending seats');
assertEqual(pendingRequest.fareTotal, 220, 'pending fare');
assertEqual(pendingRequest.rating, 4.8, 'rating from API when present');
assertTrue(pendingRequest.routeLabel?.includes('Sector 62') === true, 'route label from ride');
assertTrue(pendingRequest.pickupLabel === 'Sector 62', 'pickup short name');

const pendingWithoutRating = mapDriverBookingToPendingRequest({
  ...pendingCommute,
  passenger: {
    id: 'passenger-no-rating',
    displayName: 'No Rating User',
    profilePhoto: null,
  },
});
assertEqual(pendingWithoutRating.rating, undefined, 'no fabricated rating');

const groupedPending = groupPendingCommuteBookingsByRide([
  pendingCommute,
  pendingCommuteRide2,
]);
assertEqual(groupedPending.length, 2, 'groups pending by ride');
assertEqual(groupedPending[0]?.requests.length, 1, 'one request per ride group');
assertTrue(
  groupedPending.some((group) => group.rideId === 'ride-commute-1'),
  'includes ride-commute-1 group',
);

const pendingCounts = countPendingCommuteBookingsByRideId([pendingCommute, pendingCommuteRide2]);
assertEqual(pendingCounts['ride-commute-1'], 1, 'counts pending per ride');
assertEqual(pendingCounts['ride-commute-2'], 1, 'counts second ride pending');

if (failed.length > 0) {
  console.error('mapDriverBooking tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('mapDriverBooking tests passed');
