import assert from 'node:assert/strict';

import { HISTORY_UNAVAILABLE_LABEL } from './historyStatus';
import { mapBookingHistoryDetail, mapBookingHistoryListItem } from './mapBookingHistory';
import { mapRideHistoryDetail, mapRideHistoryListItem } from './mapRideHistory';

assert.equal('/rides/history?page=2&limit=10', '/rides/history?page=2&limit=10');
assert.equal('/rides/history/ride-1', '/rides/history/ride-1');
assert.equal('/bookings/history?status=COMPLETED', '/bookings/history?status=COMPLETED');
assert.equal('/bookings/history/booking-1', '/bookings/history/booking-1');

const rideList = mapRideHistoryListItem({
  id: 'ride-1',
  rideType: 'REGULAR',
  status: 'COMPLETED',
  source: 'Saket, Delhi',
  destination: 'Cyber City, Gurugram',
  departureDate: '2026-08-20',
  departureTime: '09:30',
  passengerCount: 2,
  earnings: { total: '300' },
  vehicle: {
    make: 'Honda',
    model: 'City',
    color: 'White',
    registrationNumber: 'DL 01 AB 1234',
    verified: true,
  },
});

assert.equal(rideList.id, 'ride-1');
assert.equal(rideList.statusLabel, 'Completed');
assert.equal(rideList.passengerCount, 2);
assert.ok(rideList.earningsLabel);
assert.notEqual(rideList.status, 'CANCELLED');

const nestedCancelledOutbound = mapRideHistoryListItem({
  ride: {
    id: 'commute-out-1',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    rideType: 'COMMUTE',
    status: 'CANCELLED',
    source: 'Home',
    destination: 'Office',
    departureDate: '2026-10-29',
    departureTime: '09:00',
    totalSeats: 3,
    availableSeats: 3,
    pricePerSeat: 40,
    maxTwoInBackSeat: false,
    noSmoking: true,
    noPets: true,
    luggageAllowed: true,
    notes: null,
    direction: 'OUTBOUND',
    occurrenceDate: '2026-10-29',
    cancelledAt: '2026-10-28T10:15:00.000Z',
  },
  vehicle: { make: 'Honda', model: 'City' },
  earnings: { total: '0' },
  passengerCount: 0,
  id: '',
  source: '',
  destination: '',
  status: '',
});
assert.equal(nestedCancelledOutbound.id, 'commute-out-1');
assert.equal(nestedCancelledOutbound.status, 'CANCELLED');
assert.equal(nestedCancelledOutbound.statusLabel, 'Cancelled');
assert.equal(nestedCancelledOutbound.commute, true);
assert.equal(nestedCancelledOutbound.direction, 'OUTBOUND');
assert.ok(nestedCancelledOutbound.cancelledAtLabel);
assert.notEqual(nestedCancelledOutbound.statusLabel, 'Completed');

const nestedCancelledReturn = mapRideHistoryListItem({
  ride: {
    id: 'commute-ret-1',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    rideType: 'COMMUTE',
    status: 'CANCELLED',
    source: 'Office',
    destination: 'Home',
    departureDate: '2026-10-29',
    departureTime: '18:30',
    totalSeats: 3,
    availableSeats: 2,
    pricePerSeat: 40,
    maxTwoInBackSeat: false,
    noSmoking: true,
    noPets: true,
    luggageAllowed: true,
    notes: null,
    direction: 'RETURN',
    occurrenceDate: '2026-10-29',
    cancelledAt: '2026-10-28T10:15:00.000Z',
  },
  vehicle: { make: 'Honda', model: 'City' },
  earnings: { total: '0' },
  passengerCount: 1,
  id: '',
  source: '',
  destination: '',
  status: '',
});
assert.equal(nestedCancelledReturn.id, 'commute-ret-1');
assert.equal(nestedCancelledReturn.status, 'CANCELLED');
assert.equal(nestedCancelledReturn.statusLabel, 'Cancelled');
assert.equal(nestedCancelledReturn.direction, 'RETURN');
assert.equal(nestedCancelledReturn.title, 'Return ride cancelled');
assert.notEqual(nestedCancelledReturn.status, 'COMPLETED');

const rideDetail = mapRideHistoryDetail(
  {
    id: 'ride-1',
    rideType: 'ASSURED',
    status: 'COMPLETED',
    source: 'Saket',
    destination: 'Cyber City',
    departureDate: '2026-08-20',
    departureTime: '09:30',
    startedAt: '2026-08-20T09:35:00.000Z',
    completedAt: '2026-08-20T10:20:00.000Z',
    durationMinutes: 45,
    distanceKm: 18.4,
    sourceLatitude: 28.5245,
    sourceLongitude: 77.2066,
    destinationLatitude: 28.4949,
    destinationLongitude: 77.0882,
    earnings: {
      passengerTotal: '300',
      driverShare: '270',
      platformShare: '30',
      assuredBonus: '50',
      otherEarnings: '10',
      total: '330',
    },
    passengers: [
      {
        bookingId: 'b1',
        displayName: 'Amit S.',
        fareAmount: '150',
        driverShare: '135',
        platformShare: '15',
      },
      {
        bookingId: 'b2',
        displayName: 'Sneha K.',
        fareAmount: '150',
        driverShare: '135',
        platformShare: '15',
      },
    ],
    vehicle: {
      vehicleType: 'CAR',
      make: 'Honda',
      model: 'City',
      variant: 'VX',
      color: 'White',
      registrationNumber: 'DL 01 AB 1234',
      registrationYear: 2022,
      seatingCapacity: 5,
      isVerified: true,
    },
  },
  'avatar://driver',
);

assert.equal(rideDetail.durationLabel, '45 mins');
assert.equal(rideDetail.distanceLabel, '18.4 km');
assert.ok(rideDetail.startedAtLabel);
assert.equal(rideDetail.vehicle.name, 'White Honda City VX');
assert.equal(rideDetail.vehicle.plateNumber, 'DL 01 AB 1234');
assert.equal(rideDetail.vehicle.verified, true);
assert.equal(rideDetail.vehicle.seatingCapacity, 5);
assert.equal(rideDetail.pickup?.latitude, 28.5245);
assert.equal(rideDetail.dropoff?.longitude, 77.0882);
assert.equal(rideDetail.earningsLines.length, 5); // 2 passengers + platform + assured + other
assert.equal(rideDetail.earningsLines[0]?.name, 'Amit S.');
assert.equal(rideDetail.earningsLines[0]?.amountLabel.includes('135'), true);
assert.ok(rideDetail.earningsLines[0]?.subtitle?.includes('150'));
assert.equal(rideDetail.totalEarningsLabel.includes('330'), true);

const sparseDetail = mapRideHistoryDetail(
  {
    id: 'ride-2',
    rideType: 'REGULAR',
    status: 'COMPLETED',
    source: 'A',
    destination: 'B',
    durationMinutes: null,
    distanceKm: null,
    totalEarnings: '300',
    passengers: [
      { bookingId: 'b1', displayName: 'Amit S.', fareAmount: '150' },
      { bookingId: 'b2', displayName: 'Sneha K.', fareAmount: '150' },
    ],
    vehicle: {
      make: 'Honda',
      model: 'City',
      registrationNumber: 'DL 01 AB 1234',
    },
  },
  'avatar://driver',
);

assert.equal(sparseDetail.durationLabel, HISTORY_UNAVAILABLE_LABEL);
assert.equal(sparseDetail.distanceLabel, HISTORY_UNAVAILABLE_LABEL);
assert.equal(sparseDetail.earningsLines.length, 2);
assert.equal(sparseDetail.earningsLines[0]?.name, 'Amit S.');

const bookingList = mapBookingHistoryListItem({
  id: 'booking-1',
  rideId: 'ride-1',
  status: 'COMPLETED',
  bookingMode: 'REGULAR',
  totalAmount: '240.00',
  source: 'Tech Park',
  destination: 'Home',
  departureDate: '2026-08-20',
  departureTime: '09:15',
  driver: { displayName: 'Vikram Singh' },
  vehicle: { make: 'Maruti', model: 'Swift', registrationNumber: 'KA 01 MG 1234' },
});

assert.equal(bookingList.bookingId, 'booking-1');
assert.equal(bookingList.statusLabel, 'Completed');

const bookingDetail = mapBookingHistoryDetail(
  {
    id: 'booking-1',
    rideId: 'ride-1',
    status: 'COMPLETED',
    totalAmount: '240',
    rideFare: '210',
    platformFee: '15',
    gst: '15',
    paymentMethod: 'PAY_LATER',
    source: 'Tech Park',
    destination: 'Home',
    departureDate: '2026-08-20',
    departureTime: '09:15',
    driver: { displayName: 'Vikram Singh', profilePhoto: 'https://example.com/a.jpg' },
    vehicle: { make: 'Maruti', model: 'Swift', registrationNumber: 'KA 01 MG 1234' },
  },
  'avatar://rider',
);

assert.equal(bookingDetail.bookingId, 'booking-1');
assert.equal(bookingDetail.driver.name, 'Vikram Singh');
assert.equal(bookingDetail.fareLines.length, 3);
assert.equal(bookingDetail.paymentMethodLabel, 'Pay After Ride');

const bookingDetailFromAlias = mapBookingHistoryDetail(
  {
    id: '',
    rideId: 'ride-1',
    status: 'COMPLETED',
    source: 'A',
    destination: 'B',
    bookingId: 'alias-booking-9',
  },
  'avatar://rider',
);
assert.equal(bookingDetailFromAlias.bookingId, 'alias-booking-9');

const bookingDetailFromFallback = mapBookingHistoryDetail(
  {
    id: '',
    rideId: 'ride-1',
    status: 'COMPLETED',
    source: 'A',
    destination: 'B',
  },
  'avatar://rider',
  'route-booking-id',
);
assert.equal(bookingDetailFromFallback.bookingId, 'route-booking-id');

console.log('mapRideHistory.test.ts — all assertions passed');
