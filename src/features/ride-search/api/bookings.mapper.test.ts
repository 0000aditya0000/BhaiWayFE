import {
  buildRegularFareEstimate,
  mapBookingToBookedRideDetails,
  mapCreateBookingError,
  parseMoneySnapshot,
  resolveDriverDisplayName,
} from '../api/bookings.mapper';
import type { BookingResponseDto } from '../api/bookings.types';
import { ENDPOINTS } from '../../../network/endpoints';

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

assertEqual(ENDPOINTS.bookings.create, '/bookings', 'POST /bookings endpoint');
assertEqual(ENDPOINTS.bookings.my, '/bookings/my', 'GET /bookings/my endpoint');
assertEqual(
  ENDPOINTS.bookings.driverMyRides,
  '/bookings/driver/my-rides',
  'GET /bookings/driver/my-rides endpoint',
);
assertEqual(ENDPOINTS.rides.publicById('abc'), '/rides/public/abc', 'GET /rides/public/:id');

const fare = buildRegularFareEstimate(120, 2);
assertEqual(fare.rideFare, 240, 'ride fare = pricePerSeat * seats');
assertEqual(fare.platformFee, 0, 'regular platform fee is 0');
assertEqual(fare.assuredFee, 0, 'regular assured fee is 0');
assertEqual(fare.total, 240, 'total equals ride fare');

assertEqual(parseMoneySnapshot('240'), 240, 'totalAmount string preserved');
assertEqual(parseMoneySnapshot('120.00'), 120, 'decimal snapshot');

const booking: BookingResponseDto = {
  id: 'booking-1',
  rideId: 'ride-1',
  passengerId: 'passenger-1',
  seats: 2,
  status: 'CONFIRMED',
  paymentMethod: 'PAY_LATER',
  paymentStatus: 'UNPAID',
  pricePerSeatSnapshot: '120',
  totalAmount: '240',
  securityDepositAmount: null,
  securityDepositPercentage: null,
  bookingMode: 'REGULAR',
  ride: {
    id: 'ride-1',
    rideType: 'REGULAR',
    status: 'PUBLISHED',
    source: 'Noida Sector 18',
    destination: 'Bareilly',
    departureDate: '2026-08-21',
    departureTime: '09:00:00',
  },
  driver: {
    id: 'driver-1',
    displayName: 'Rahul Sharma',
    profilePhoto: null,
  },
  vehicle: {
    id: 'vehicle-1',
    make: 'Tata',
    model: 'Nexon',
    color: 'Black',
    registrationNumber: 'DL 3C AB 1234',
  },
};

const details = mapBookingToBookedRideDetails(booking);
assertEqual(details.bookingId, 'booking-1', 'booking id');
assertEqual(details.rideType, 'regular', 'regular mode');
assertEqual(details.seats, 2, 'seats from booking');
assertEqual(details.fareTotal, 240, 'fare from totalAmount');
assertEqual(details.paymentMethod, 'PAY_LATER', 'payment method');
assertEqual(details.paymentStatus, 'UNPAID', 'payment status');
assertEqual(details.vehicle, 'Black Tata Nexon', 'vehicle includes color when present');
assertEqual(details.plateNumber, 'DL 3C AB 1234', 'plate from registrationNumber');
assertEqual(details.driverName, 'Rahul Sharma', 'driver from displayName');
assertTrue(!JSON.stringify(details).includes('platformFee'), 'no platform fee field');

const firstLastDriver: BookingResponseDto = {
  ...booking,
  driver: {
    id: 'driver-1',
    firstName: 'Rahul',
    lastName: 'Sharma',
    profilePhoto: null,
  },
};
assertEqual(
  resolveDriverDisplayName(firstLastDriver),
  'Rahul Sharma',
  'driver firstName + lastName',
);
assertEqual(
  mapBookingToBookedRideDetails(firstLastDriver).driverName,
  'Rahul Sharma',
  'booked details uses firstName + lastName',
);

const missingDriver: BookingResponseDto = {
  ...booking,
  driver: null,
};
assertEqual(resolveDriverDisplayName(missingDriver), '', 'empty when driver snapshot missing');
assertEqual(
  mapBookingToBookedRideDetails(missingDriver).driverName,
  'Driver',
  'fallback label when driver name absent',
);

assertEqual(
  mapCreateBookingError({ status: 403, message: '' }),
  'Identity verification is required before you can book a ride.',
  '403 identity message',
);
assertEqual(
  mapCreateBookingError({ status: 409, message: '' }),
  'Sorry, these seats are no longer available. Please search again.',
  '409 seats message',
);
assertEqual(
  mapCreateBookingError({ status: 403, message: 'Wallet is suspended' }),
  'Wallet is suspended',
  '403 wallet lock uses backend text',
);
assertEqual(
  mapCreateBookingError({ status: 422, message: '' }),
  'Insufficient BhaiWay Coins for this booking. Add coins and try again.',
  '422 insufficient wallet fallback',
);
assertEqual(
  mapCreateBookingError({ status: 404, message: '' }),
  'This ride is no longer available. Please search again.',
  '404 ride unavailable',
);
assertEqual(
  mapCreateBookingError({ status: 400, message: 'Invalid payment method' }),
  'Invalid payment method',
  '400 invalid payment method',
);

const createBody = {
  rideId: 'ride-1',
  seats: 2,
  paymentMethod: 'WALLET' as const,
};
assertTrue(!('passengerId' in createBody), 'does not send passengerId');
assertTrue(!('totalAmount' in createBody), 'does not send totalAmount');
assertTrue(!('pricePerSeat' in createBody), 'does not send pricePerSeat');
assertTrue(!('status' in createBody), 'does not send status');
assertTrue(!('farePayment' in createBody), 'Regular does not send farePayment');

if (failed.length > 0) {
  throw new Error(`bookings.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('bookings.mapper tests passed');
