/**
 * Driver commute booking request management tests.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');
const failed = [];

const assertEqual = (actual, expected, label) => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value, label) => {
  if (!value) failed.push(`${label}: expected true`);
};

const assertIncludes = (haystack, needle, label) => {
  if (!String(haystack).includes(needle)) {
    failed.push(`${label}: missing ${needle}`);
  }
};

const assertNotIncludes = (haystack, needle, label) => {
  if (String(haystack).includes(needle)) {
    failed.push(`${label}: should not contain ${needle}`);
  }
};

// Inline mirrors (keep in sync with mapDriverBooking.ts)
const isCommuteBookingMode = (booking) =>
  String(booking.bookingMode ?? '').trim().toUpperCase() === 'COMMUTE';

const isPendingCommuteBooking = (booking) =>
  isCommuteBookingMode(booking) &&
  String(booking.status ?? '').trim().toUpperCase() === 'PENDING';

const filterPendingCommuteBookings = (rows) => rows.filter(isPendingCommuteBooking);

const countPendingCommuteBookingsByRideId = (rows) => {
  const counts = {};
  for (const booking of filterPendingCommuteBookings(rows)) {
    const rideId = String(booking.rideId ?? booking.ride?.id ?? '').trim();
    if (!rideId) continue;
    counts[rideId] = (counts[rideId] ?? 0) + 1;
  }
  return counts;
};

const groupPendingCommuteBookingsByRide = (rows) => {
  const grouped = new Map();
  for (const booking of filterPendingCommuteBookings(rows)) {
    const rideId = String(booking.rideId ?? booking.ride?.id ?? '').trim();
    if (!rideId) continue;
    const list = grouped.get(rideId) ?? [];
    list.push(booking);
    grouped.set(rideId, list);
  }
  return Array.from(grouped.entries()).map(([rideId, bookings]) => ({
    rideId,
    requests: bookings,
  }));
};

const mapCommuteBookingAcceptError = (error) => {
  const status = error?.status;
  const code = String(error?.code ?? '').trim().toUpperCase();
  if (code === 'INSUFFICIENT_SEATS' || status === 409) {
    return 'Not enough seats available. Another request may have already been accepted.';
  }
  if (status === 404 || status === 410) {
    return 'This booking request has already been processed.';
  }
  return 'Please try again.';
};

const pendingCommute = {
  id: 'pending-1',
  rideId: 'ride-1',
  status: 'PENDING',
  bookingMode: 'COMMUTE',
  seats: 2,
};

const pendingRegular = {
  id: 'pending-2',
  rideId: 'ride-1',
  status: 'PENDING',
  bookingMode: 'REGULAR',
  seats: 1,
};

const pendingCommuteRide2 = {
  id: 'pending-3',
  rideId: 'ride-2',
  status: 'PENDING',
  bookingMode: 'COMMUTE',
  seats: 1,
};

assertEqual(filterPendingCommuteBookings([pendingCommute, pendingRegular]).length, 1, 'filters COMMUTE PENDING');
assertEqual(countPendingCommuteBookingsByRideId([pendingCommute, pendingCommuteRide2])['ride-1'], 1, 'counts ride-1');
assertEqual(groupPendingCommuteBookingsByRide([pendingCommute, pendingCommuteRide2]).length, 2, 'groups by ride');

assertIncludes(
  mapCommuteBookingAcceptError({ status: 409, code: 'INSUFFICIENT_SEATS' }),
  'Not enough seats available',
  'insufficient seats error',
);

assertIncludes(
  mapCommuteBookingAcceptError({ status: 404 }),
  'already been processed',
  'already processed error',
);

const actionsHook = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useCommuteBookingRequestActions.ts'),
  'utf8',
);
assertIncludes(actionsHook, 'inFlightIdsRef', 'per-booking in-flight guard');
assertIncludes(actionsHook, 'acceptBookingById', 'accept by booking id');
assertIncludes(actionsHook, 'rejectBookingById', 'reject by booking id');
assertIncludes(actionsHook, 'showAppAlert', 'reject confirmation dialog');

const mapDriverBooking = fs.readFileSync(
  path.join(root, 'features/my-rides/utils/mapDriverBooking.ts'),
  'utf8',
);
assertNotIncludes(mapDriverBooking, 'rating: 4.8', 'no fabricated rating default');

if (failed.length > 0) {
  console.error('commuteBookingRequests tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('commuteBookingRequests tests passed');
