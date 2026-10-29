/**
 * Pure Node tests for past-ride history detail unwrapping + ride-type resolution.
 * Avoids RN barrel imports used by mapRideHistory.ts.
 */
const assert = require('node:assert/strict');
const {
  flattenRideHistoryListItem,
  flattenRideHistoryListItems,
  unwrapRideHistoryItem,
} = require('../../offer-ride/api/ridesHistory.unwrap.ts');
const {
  unwrapBookingHistoryItem,
} = require('../../ride-search/api/bookingsHistory.unwrap.ts');

const resolveRideType = (rideType) => {
  const raw = String(rideType ?? '').trim().toUpperCase();
  if (raw === 'COMMUTE') return 'commute';
  if (raw === 'ASSURED') return 'assured';
  return 'regular';
};

assert.equal(resolveRideType('REGULAR'), 'regular');
assert.equal(resolveRideType('ASSURED'), 'assured');
assert.equal(resolveRideType('COMMUTE'), 'commute');

const wrappedRide = unwrapRideHistoryItem({
  data: {
    id: 'wrapped-ride',
    rideType: 'ASSURED',
    status: 'COMPLETED',
    source: 'Noida',
    destination: 'Delhi',
    startedAt: '2026-08-20T09:35:00.000Z',
    durationMinutes: 42,
    distanceKm: 12.5,
    sourceLatitude: 28.5,
    sourceLongitude: 77.2,
    destinationLatitude: 28.6,
    destinationLongitude: 77.1,
    earnings: {
      passengerTotal: '500',
      driverShare: '450',
      platformShare: '50',
      assuredBonus: '100',
      otherEarnings: '0',
      total: '550',
    },
    passengers: [
      {
        bookingId: 'b1',
        displayName: 'Riya',
        fareAmount: '500',
        driverShare: '450',
        platformShare: '50',
      },
    ],
    vehicle: {
      vehicleType: 'CAR',
      make: 'Honda',
      model: 'City',
      registrationNumber: 'DL 01 AB 1234',
      seatingCapacity: 5,
      isVerified: true,
    },
  },
});
assert.equal(wrappedRide.id, 'wrapped-ride');
assert.equal(wrappedRide.source, 'Noida');
assert.equal(resolveRideType(wrappedRide.rideType), 'assured');
assert.equal(wrappedRide.passengers.length, 1);
assert.equal(wrappedRide.earnings.total, '550');
assert.equal(wrappedRide.passengers[0].driverShare, '450');
assert.equal(wrappedRide.vehicle.isVerified, true);
assert.equal(wrappedRide.distanceKm, 12.5);
assert.equal(wrappedRide.durationMinutes, 42);

const bareRide = unwrapRideHistoryItem({
  id: 'bare-ride',
  rideType: 'COMMUTE',
  status: 'COMPLETED',
  source: 'HQ',
  destination: 'Home',
});
assert.equal(bareRide.id, 'bare-ride');
assert.equal(resolveRideType(bareRide.rideType), 'commute');

// Core fields at root + rich detail nested under data must merge (not drop detail).
const mergedRide = unwrapRideHistoryItem({
  id: 'merged-ride',
  status: 'COMPLETED',
  source: 'Root Pickup',
  destination: 'Root Drop',
  data: {
    distanceKm: '12.5',
    durationMinutes: '40',
    earnings: { total: '275', driverShare: '250', platformShare: '25' },
    vehicle: {
      make: 'Toyota',
      model: 'Innova',
      registrationNumber: 'KA 01 AB 9999',
      isVerified: true,
    },
    passengers: [{ bookingId: 'p1', displayName: 'Asha', driverShare: '250' }],
  },
});
assert.equal(mergedRide.id, 'merged-ride');
assert.equal(mergedRide.source, 'Root Pickup');
assert.equal(mergedRide.distanceKm, '12.5');
assert.equal(mergedRide.earnings.total, '275');
assert.equal(mergedRide.vehicle.make, 'Toyota');
assert.equal(mergedRide.passengers.length, 1);

const wrappedBooking = unwrapBookingHistoryItem({
  booking: {
    id: 'wrapped-booking',
    status: 'COMPLETED',
    bookingMode: 'ASSURED',
    totalAmount: '350',
    source: 'Airport',
    destination: 'Hotel',
    ride: { id: 'r1', rideType: 'ASSURED', source: 'Airport', destination: 'Hotel' },
  },
});
assert.equal(wrappedBooking.id, 'wrapped-booking');
assert.equal(wrappedBooking.source, 'Airport');
assert.equal(wrappedBooking.bookingMode, 'ASSURED');

const bareBooking = unwrapBookingHistoryItem({
  id: 'bare-booking',
  status: 'COMPLETED',
  bookingMode: 'COMMUTE',
  source: 'Office',
  destination: 'Metro',
});
assert.equal(bareBooking.id, 'bare-booking');
assert.equal(bareBooking.bookingMode, 'COMMUTE');

let threw = false;
try {
  unwrapRideHistoryItem({ meta: true });
} catch {
  threw = true;
}
assert.equal(threw, true);

const nestedHistoryPage = flattenRideHistoryListItems([
  {
    ride: {
      id: 'commute-out-cancelled',
      rideType: 'COMMUTE',
      status: 'CANCELLED',
      direction: 'OUTBOUND',
      occurrenceDate: '2026-10-29',
      source: 'Home',
      destination: 'Office',
      cancelledAt: '2026-10-28T10:15:00.000Z',
    },
    vehicle: { make: 'Honda', model: 'City' },
    earnings: { total: '0' },
    passengerCount: 0,
  },
  {
    ride: {
      id: 'commute-ret-cancelled',
      rideType: 'COMMUTE',
      status: 'CANCELLED',
      direction: 'RETURN',
      occurrenceDate: '2026-10-29',
      source: 'Office',
      destination: 'Home',
      cancelledAt: '2026-10-28T10:15:00.000Z',
    },
    vehicle: { make: 'Honda', model: 'City' },
    earnings: { total: '0' },
    passengerCount: 1,
  },
  {
    ride: {
      id: 'regular-completed',
      rideType: 'REGULAR',
      status: 'COMPLETED',
      source: 'Saket',
      destination: 'Cyber City',
    },
    vehicle: { make: 'Toyota', model: 'Innova' },
    earnings: { total: '400' },
    passengerCount: 2,
  },
]);

const outbound = nestedHistoryPage[0];
assert.equal(outbound.id, 'commute-out-cancelled');
assert.equal(outbound.status, 'CANCELLED');
assert.equal(outbound.rideType, 'COMMUTE');
assert.equal(outbound.direction, 'OUTBOUND');
assert.equal(outbound.cancelledAt, '2026-10-28T10:15:00.000Z');
assert.equal(outbound.passengerCount, 0);
assert.equal(outbound.vehicle.make, 'Honda');

const returning = nestedHistoryPage[1];
assert.equal(returning.id, 'commute-ret-cancelled');
assert.equal(returning.status, 'CANCELLED');
assert.equal(returning.direction, 'RETURN');
assert.equal(returning.passengerCount, 1);

const regular = nestedHistoryPage[2];
assert.equal(regular.status, 'COMPLETED');
assert.equal(regular.rideType, 'REGULAR');
assert.notEqual(regular.status, 'CANCELLED');

const alreadyFlat = flattenRideHistoryListItem({
  id: 'flat-cancelled',
  rideType: 'COMMUTE',
  status: 'CANCELLED',
  source: 'A',
  destination: 'B',
  cancelledAt: '2026-10-28T11:00:00.000Z',
});
assert.equal(alreadyFlat.id, 'flat-cancelled');
assert.equal(alreadyFlat.status, 'CANCELLED');

console.log('pastRideHistory.detail.test.js — all assertions passed');
