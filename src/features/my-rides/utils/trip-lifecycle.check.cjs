/**
 * Lightweight lifecycle contract checks (no TS path aliases).
 * Run: node src/features/my-rides/utils/trip-lifecycle.check.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');
const failed = [];

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${expected}, got ${actual}`);
  }
};

const assertIncludes = (haystack, needle, label) => {
  if (!haystack.includes(needle)) {
    failed.push(`${label}: missing ${needle}`);
  }
};

const assertNotIncludes = (haystack, needle, label) => {
  if (haystack.includes(needle)) {
    failed.push(`${label}: should not contain ${needle}`);
  }
};

const endpoints = fs.readFileSync(path.join(root, 'network/endpoints.ts'), 'utf8');
assertIncludes(endpoints, "start: (id: string) => `/rides/${id}/start`", 'endpoints start');
assertIncludes(
  endpoints,
  "complete: (id: string) => `/rides/${id}/complete`",
  'endpoints complete',
);
assertIncludes(
  endpoints,
  "verifyPickup: (id: string) => `/bookings/${id}/verify-pickup`",
  'endpoints verify-pickup',
);

const useMyRides = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useMyRides.ts'),
  'utf8',
);
assertIncludes(useMyRides, 'startRideById', 'useMyRides calls startRideById');
assertNotIncludes(useMyRides, 'startMissing', 'useMyRides has no startMissing alert');

const useDriverPickup = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useDriverPickup.ts'),
  'utf8',
);
assertIncludes(useDriverPickup, 'verifyPickupById', 'useDriverPickup calls verifyPickupById');
assertIncludes(useDriverPickup, 'bookingQueueRef', 'useDriverPickup uses cached driver bookings');
assertNotIncludes(useDriverPickup, 'getBookingById', 'useDriverPickup does not call passenger GET /bookings/:id');
assertIncludes(useDriverPickup, 'buildPickupQueue', 'useDriverPickup uses pickup queue');
assertNotIncludes(useDriverPickup, 'tripStartedStore', 'useDriverPickup has no tripStartedStore');
assertNotIncludes(useDriverPickup, 'DEFAULT_DRIVER_PICKUP_STOPS', 'useDriverPickup has no demo stops');
assertNotIncludes(useDriverPickup, 'otpMissing', 'useDriverPickup has no otpMissing alert');
assertNotIncludes(
  useDriverPickup,
  'reportPassengerNoShow',
  'pickup OTP verify does not submit no-show',
);
assertIncludes(
  useDriverPickup,
  'verifyPickupById(stop.id, { otp: otpValue })',
  'pickup OTP still verifies with booking id + otp',
);

const pickupOtpModal = fs.readFileSync(
  path.join(root, 'features/my-rides/components/PickupOtpModal/PickupOtpModal.tsx'),
  'utf8',
);
assertIncludes(pickupOtpModal, 'onPress={onVerify}', 'OTP confirm still calls onVerify');
assertIncludes(pickupOtpModal, 'footerExtra', 'No-Show is a separate OTP footer slot');
assertNotIncludes(
  pickupOtpModal,
  'reportPassengerNoShow',
  'OTP modal does not call no-show from verify',
);

const driverPickupScreen = fs.readFileSync(
  path.join(root, 'screens/my-rides/DriverPickupScreen/DriverPickupScreen.tsx'),
  'utf8',
);
assertIncludes(driverPickupScreen, 'useNoShowClaim', 'pickup screen wires No-Show hook');
assertIncludes(driverPickupScreen, 'footerExtra', 'No-Show action is passed beside OTP, not as verify');
assertIncludes(
  driverPickupScreen,
  'resolvePassengerNoShowBookingId(stop.id)',
  'No-Show targets the current pickup booking id',
);
assertIncludes(driverPickupScreen, 'onVerify={handleVerify}', 'OTP verify handler unchanged');

const riderBooked = fs.readFileSync(
  path.join(root, 'screens/my-rides/RiderBookedRideScreen/RiderBookedRideScreen.tsx'),
  'utf8',
);
assertIncludes(riderBooked, 'useNoShowClaim', 'rider booked ride wires No-Show');
assertIncludes(riderBooked, "role: 'passenger'", 'rider booked ride is passenger-only');
assertIncludes(riderBooked, 'isRideOwner: false', 'driver of own ride is not treated as passenger');

const commuteBooked = fs.readFileSync(
  path.join(root, 'screens/office-commute/CommuteRideBookedScreen/CommuteRideBookedScreen.tsx'),
  'utf8',
);
assertIncludes(commuteBooked, 'useNoShowClaim', 'commute booked ride wires No-Show');

const noShowPanel = fs.readFileSync(
  path.join(root, 'features/no-show/components/NoShowClaimPanel.tsx'),
  'utf8',
);
assertNotIncludes(noShowPanel, 'claim.effects', 'effects are not shown in the UI');
assertIncludes(noShowPanel, 'claim.claimantName', 'claimant name shown only when provided');

const useLiveTracking = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useLiveTracking.ts'),
  'utf8',
);
assertIncludes(useLiveTracking, 'IN_PROGRESS', 'live tracking waits for IN_PROGRESS');
assertIncludes(useLiveTracking, 'pickupOtp', 'live tracking reads pickupOtp');
assertIncludes(
  useLiveTracking,
  'backendRideInProgress',
  'live tracking uses backend ride status when bookingId is set',
);

const useDriverActiveTrip = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useDriverActiveTrip.ts'),
  'utf8',
);
assertIncludes(useDriverActiveTrip, 'await completeRideById(rideId', 'active trip completes via API for all ride kinds');
assertIncludes(
  useDriverActiveTrip,
  'resolveRideCompletedOnBackend',
  'active trip reconciles COMPLETED after complete timeout',
);
assertIncludes(
  useDriverActiveTrip,
  'COMPLETE_RIDE_TIMEOUT_MS',
  'active trip uses extended complete timeout',
);

const useDriverTripCompleted = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useDriverTripCompleted.ts'),
  'utf8',
);
assertNotIncludes(
  useDriverTripCompleted,
  "rideType === 'assured'",
  'driver trip completed supports assured ratings',
);

const pickupQueue = fs.readFileSync(
  path.join(root, 'features/my-rides/utils/pickupQueue.ts'),
  'utf8',
);
assertIncludes(pickupQueue, 'pickupOrder', 'queue sorts by pickupOrder');
assertIncludes(pickupQueue, 'PICKED_UP', 'queue understands PICKED_UP');

// Pure queue behavior
const normalize = (value) => String(value ?? '').trim().toUpperCase();
const ACTIVE = new Set(['CONFIRMED', 'PENDING', 'ACCEPTED', 'ACTIVE']);
const buildPickupQueue = (bookings) =>
  [...bookings]
    .filter((row) => ACTIVE.has(normalize(row.status)))
    .sort((a, b) => {
      const orderA = typeof a.pickupOrder === 'number' ? a.pickupOrder : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.pickupOrder === 'number' ? b.pickupOrder : Number.MAX_SAFE_INTEGER;
      return orderA - orderB || String(a.id).localeCompare(String(b.id));
    });
const isPickupCompleted = (booking) => normalize(booking.pickupStatus) === 'PICKED_UP';
const findNextPickupIndex = (queue) => queue.findIndex((b) => !isPickupCompleted(b));

const queue = buildPickupQueue([
  { id: 'b2', status: 'CONFIRMED', pickupStatus: 'WAITING_FOR_PICKUP', pickupOrder: 2 },
  { id: 'b1', status: 'CONFIRMED', pickupStatus: 'PICKED_UP', pickupOrder: 1 },
  { id: 'b3', status: 'CANCELLED', pickupStatus: 'WAITING_FOR_PICKUP', pickupOrder: 0 },
]);
assertEqual(queue.map((r) => r.id).join(','), 'b1,b2', 'queue order + cancel filter');
assertEqual(findNextPickupIndex(queue), 1, 'next pickup index');

if (failed.length) {
  console.error('FAILED');
  failed.forEach((line) => console.error(' -', line));
  process.exit(1);
}
console.log('trip-lifecycle.check.cjs passed');
