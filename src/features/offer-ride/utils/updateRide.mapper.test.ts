import { ENDPOINTS } from '../../../network/endpoints';
import type { BookingResponseDto } from '../../ride-search/api/bookings.types';
import type { RideResponseDto } from '../api/rides.types';
import {
  assertUpdateRidePayload,
  buildUpdateRidePayload,
  computeSeatBounds,
  isRideModifiable,
  mapUpdateRideError,
  resolveBookedSeats,
} from './updateRide.mapper';

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

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

assertEqual(ENDPOINTS.rides.byId('ride-1'), '/rides/ride-1', 'PATCH /rides/:id path');
assertTrue(isRideModifiable('PUBLISHED'), 'PUBLISHED is modifiable');
assertFalse(isRideModifiable('IN_PROGRESS'), 'IN_PROGRESS is not modifiable');
assertFalse(isRideModifiable('COMPLETED'), 'COMPLETED is not modifiable');
assertFalse(isRideModifiable('CANCELLED'), 'CANCELLED is not modifiable');

assertEqual(computeSeatBounds(0), { min: 1, max: 8 }, 'no bookings → min 1 max 8');
assertEqual(computeSeatBounds(1), { min: 1, max: 8 }, '1 booked → min 1');
assertEqual(computeSeatBounds(2), { min: 2, max: 8 }, '2 booked → min 2');
assertEqual(computeSeatBounds(4), { min: 4, max: 8 }, '4 booked → min 4');

const baseForm = {
  rideId: 'ride-1',
  origin: 'Noida',
  destination: 'Delhi',
  originalOrigin: 'Noida',
  originalDestination: 'Delhi',
  departureDate: '20/08/2026',
  departureTime: '9:00 AM',
  availableSeats: 4,
  pricePerSeat: '250',
  maxTwoInBackSeat: true,
  womenOnly: true,
  preferences: {
    noSmoking: true,
    noPets: false,
    luggage: true,
    music: false,
  },
  selectedVehicleId: '11111111-2222-3333-4444-555555555555',
  originLatitude: null,
  originLongitude: null,
  destinationLatitude: null,
  destinationLongitude: null,
  routeSelection: null,
  routeSelected: true,
  routeLengthMeters: 24500,
  routeDurationSeconds: 2400,
};

const unlocked = buildUpdateRidePayload({
  form: baseForm,
  hasBookings: false,
  bookedSeats: 0,
});
assertTrue(unlocked.ok, 'no bookings payload ok');
if (unlocked.ok) {
  assertEqual(unlocked.payload.source, 'Noida', 'source included');
  assertEqual(unlocked.payload.destination, 'Delhi', 'destination included');
  assertEqual(unlocked.payload.departureDate, '2026-08-20', 'date included');
  assertEqual(unlocked.payload.departureTime, '09:00', 'time included');
  assertEqual(unlocked.payload.totalSeats, 4, 'totalSeats included');
  assertEqual(unlocked.payload.pricePerSeat, 250, 'price included');
  assertEqual(unlocked.payload.womenOnly, true, 'womenOnly included before bookings');
  assertFalse('availableSeats' in unlocked.payload, 'never send availableSeats');
  assertFalse('status' in unlocked.payload, 'never send status');
  assertFalse('driverId' in unlocked.payload, 'never send driverId');
  assertUpdateRidePayload(unlocked.payload);
}

const locked = buildUpdateRidePayload({
  form: baseForm,
  hasBookings: true,
  bookedSeats: 2,
});
assertTrue(locked.ok, 'bookings payload ok');
if (locked.ok) {
  assertEqual(Object.keys(locked.payload).sort(), ['totalSeats'], 'only totalSeats when bookings exist');
  assertEqual(locked.payload.totalSeats, 4, 'seats value preserved');
  assertFalse('bookedSeats' in locked.payload, 'never send bookedSeats');
  assertFalse('source' in locked.payload, 'do not resend source with bookings');
  assertFalse('pricePerSeat' in locked.payload, 'do not resend price with bookings');
  assertFalse('womenOnly' in locked.payload, 'do not change womenOnly after bookings');
  assertFalse('routeSelectionToken' in locked.payload, 'do not send token with bookings-only update');
  assertUpdateRidePayload(locked.payload);
}

const unrelatedEdit = buildUpdateRidePayload({
  form: { ...baseForm, availableSeats: 5 },
  hasBookings: false,
  bookedSeats: 0,
});
assertTrue(unrelatedEdit.ok, 'unrelated edit without endpoint change is ok');
if (unrelatedEdit.ok) {
  assertFalse(
    'routeSelectionToken' in unrelatedEdit.payload,
    'unrelated edits preserve the existing route and omit token',
  );
  assertFalse(
    'seriesScope' in unrelatedEdit.payload,
    'non-series update omits seriesScope',
  );
}

const seriesEdit = buildUpdateRidePayload({
  form: { ...baseForm, availableSeats: 5 },
  hasBookings: false,
  bookedSeats: 0,
  seriesScope: 'THIS_AND_FUTURE',
});
assertTrue(seriesEdit.ok, 'series update maps');
if (seriesEdit.ok) {
  assertEqual(
    seriesEdit.payload.seriesScope,
    'THIS_AND_FUTURE',
    'series update sends THIS_AND_FUTURE',
  );
}

const seriesThisOnly = buildUpdateRidePayload({
  form: { ...baseForm, availableSeats: 4 },
  hasBookings: true,
  bookedSeats: 1,
  seriesScope: 'THIS_OCCURRENCE',
});
assertTrue(seriesThisOnly.ok, 'booked series seats-only update maps');
if (seriesThisOnly.ok) {
  assertEqual(
    seriesThisOnly.payload.seriesScope,
    'THIS_OCCURRENCE',
    'booked series update still sends THIS_OCCURRENCE',
  );
}

const routeChangedMissingToken = buildUpdateRidePayload({
  form: { ...baseForm, origin: 'Ghaziabad' },
  hasBookings: false,
  bookedSeats: 0,
});
assertFalse(routeChangedMissingToken.ok, 'route change without selection is blocked');

const routeChanged = buildUpdateRidePayload({
  form: {
    ...baseForm,
    origin: 'Ghaziabad',
    originLatitude: 28.67,
    originLongitude: 77.42,
    destinationLatitude: 28.6139,
    destinationLongitude: 77.209,
    routeSelection: {
      selectionToken: 'new-token',
      optionId: 'opt-2',
      polyline: '_p~iF~ps|U',
      distanceMeters: 30000,
      durationSeconds: 3000,
      sourceLatitude: 28.67,
      sourceLongitude: 77.42,
      destinationLatitude: 28.6139,
      destinationLongitude: 77.209,
    },
  },
  hasBookings: false,
  bookedSeats: 0,
});
assertTrue(routeChanged.ok, 'route change with new selection maps');
if (routeChanged.ok) {
  assertEqual(routeChanged.payload.routeSelectionToken, 'new-token', 'new token attached');
  assertEqual(routeChanged.payload.sourceLatitude, 28.67, 'matching source lat attached');
  assertFalse('polyline' in routeChanged.payload, 'polyline is not sent on PATCH');
}

const tooLow = buildUpdateRidePayload({
  form: { ...baseForm, availableSeats: 1 },
  hasBookings: true,
  bookedSeats: 2,
});
assertFalse(tooLow.ok, 'cannot go below booked seats');

assertTrue(
  mapUpdateRideError({ status: 409, message: '' }).includes('cannot be changed'),
  '409 → route/schedule/fare conflict message',
);
assertTrue(
  mapUpdateRideError({ status: 400, message: '' }).includes('already booked'),
  '400 → seats below booked message',
);
assertTrue(
  mapUpdateRideError({ status: 409, message: 'Custom conflict' }) === 'Custom conflict',
  '409 prefers backend message',
);
assertTrue(
  mapUpdateRideError({ status: 400, message: 'Custom seats error' }) === 'Custom seats error',
  '400 prefers backend message',
);

const ride: RideResponseDto = {
  id: 'ride-1',
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  rideType: 'REGULAR',
  status: 'PUBLISHED',
  source: 'Noida',
  destination: 'Delhi',
  departureDate: '2026-08-20',
  departureTime: '09:00',
  totalSeats: 4,
  availableSeats: 2,
  pricePerSeat: 250,
  maxTwoInBackSeat: true,
  noSmoking: true,
  noPets: false,
  luggageAllowed: true,
  notes: null,
};

const active: BookingResponseDto = {
  id: 'b1',
  rideId: 'ride-1',
  passengerId: 'p1',
  seats: 2,
  status: 'CONFIRMED',
  paymentMethod: 'PAY_LATER',
  paymentStatus: 'UNPAID',
  pricePerSeatSnapshot: '250',
  totalAmount: '500',
  bookingMode: 'REGULAR',
  createdAt: '2026-08-21T10:15:00.000Z',
};

const cancelled: BookingResponseDto = {
  ...active,
  id: 'b2',
  status: 'CANCELLED',
  seats: 1,
};

assertEqual(resolveBookedSeats(ride, [active, cancelled]), 2, 'cancelled seats ignored');

if (failed.length > 0) {
  console.error('updateRide.mapper tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('updateRide.mapper tests passed');
