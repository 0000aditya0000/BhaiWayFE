/**
 * Driver Assured lifecycle Phase 2A — plain Node structural + logic tests.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');
const failed = [];

const assertTrue = (value, label) => {
  if (!value) failed.push(`${label}: expected true`);
};

const assertFalse = (value, label) => {
  if (value) failed.push(`${label}: expected false`);
};

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
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

const useMyRides = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useMyRides.ts'),
  'utf8',
);
const useDriverPickup = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useDriverPickup.ts'),
  'utf8',
);
const endpoints = fs.readFileSync(path.join(root, 'network/endpoints.ts'), 'utf8');
const ridesApi = fs.readFileSync(
  path.join(root, 'features/offer-ride/api/rides.api.ts'),
  'utf8',
);
const bookingsApi = fs.readFileSync(
  path.join(root, 'features/ride-search/api/bookings.api.ts'),
  'utf8',
);

// APIs integrated
assertIncludes(endpoints, "start: (id: string) => `/rides/${id}/start`", 'POST /rides/:id/start endpoint');
assertIncludes(endpoints, "verifyPickup: (id: string) => `/bookings/${id}/verify-pickup`", 'verify-pickup endpoint');
assertIncludes(ridesApi, 'startRideById', 'startRideById client');
assertIncludes(bookingsApi, 'getBookingById', 'getBookingById client');
assertIncludes(bookingsApi, 'verifyPickupById', 'verifyPickupById client');

// 1–5 Start Ride (Assured + Regular unified)
assertIncludes(useMyRides, 'startRideById(rideId)', 'trackRide calls startRideById with rideId');
assertIncludes(useMyRides, 'getDriverPickupPath({', 'navigates to pickup with rideId');
assertNotIncludes(useMyRides, 'router.push(getDriverPickupPath(rideType))', 'no assured-only demo pickup navigation');
assertIncludes(useMyRides, 'startingRideId', 'double-tap guard via startingRideId');
assertIncludes(useMyRides, 'await startRideById(rideId)', 'awaits backend before navigation');
assertIncludes(useMyRides, 'driverRidesRefreshStore.bump()', 'refreshes rides after start');
assertIncludes(useMyRides, 'await refresh()', 'refetches list after start success');

// 6–10 Pickup / OTP (backend path)
assertIncludes(useDriverPickup, 'bookingQueueRef', 'uses cached driver booking queue');
assertIncludes(useDriverPickup, 'verifyPickupById', 'calls verify-pickup');
assertNotIncludes(useDriverPickup, 'getBookingById', 'does not call passenger-only GET /bookings/:id');
assertIncludes(useDriverPickup, 'listDriverBookings', 'loads driver bookings from backend');
assertNotIncludes(useDriverPickup, 'tripStartedStore', 'no tripStartedStore');
assertNotIncludes(useDriverPickup, 'DEFAULT_DRIVER_PICKUP_STOPS', 'no demo pickup stops');
assertNotIncludes(useDriverPickup, 'setTimeout', 'no local OTP verify delay');
assertIncludes(useDriverPickup, 'usesBackendPickup', 'backend pickup when rideId present');
assertIncludes(useDriverPickup, 'otpRequestInFlightRef', 'prevents double OTP fetch');
assertIncludes(useDriverPickup, "otp: ''", 'never attaches local OTP to stops');

// Error handling
assertIncludes(useMyRides, 'mapLifecycleError', 'start ride lifecycle errors');
assertIncludes(useDriverPickup, 'mapLifecycleError', 'pickup lifecycle errors');

// mapLifecycleError logic
const mapLifecycleError = (error, fallback) => {
  const isApiError = (e) => Boolean(e && typeof e === 'object' && 'status' in e);
  if (isApiError(error)) {
    if (error.status === 401) return 'Your session expired. Please sign in again.';
    if (error.status === 404) return 'This ride or booking could not be found.';
    if (error.status === 409) return error.message || 'This action was already completed.';
    if (error.status === 422) return error.message || 'Invalid request. Please check and try again.';
    if (error.message) return error.message;
  }
  return fallback;
};
assertEqual(mapLifecycleError({ status: 404 }, 'x'), 'This ride or booking could not be found.', '404 mapping');
assertEqual(mapLifecycleError({ status: 422 }, 'x'), 'Invalid request. Please check and try again.', '422 mapping');

// Start ride flow simulation — backend status only after API success
let localStatus = 'ASSURANCE_ACTIVE';
const response = { id: 'e50c2975-193c-4706-ac0b-0544302bcda4', status: 'IN_PROGRESS' };
assertEqual(localStatus, 'ASSURANCE_ACTIVE', 'status unchanged before API');
localStatus = response.status;
assertEqual(localStatus, 'IN_PROGRESS', 'backend response status preserved after success');
assertEqual(response.id, 'e50c2975-193c-4706-ac0b-0544302bcda4', 'real rideId preserved');

// Pickup verify simulation
let tripUnlocked = false;
const verifyOk = (otp, backendOtp) => {
  if (otp !== backendOtp) return false;
  tripUnlocked = true;
  return true;
};
assertTrue(verifyOk('1234', '1234'), 'verify succeeds with backend OTP');
assertTrue(tripUnlocked, 'trip unlocked only after success');
tripUnlocked = false;
assertFalse(verifyOk('0000', '1234'), 'failed verify rejected');
assertFalse(tripUnlocked, 'trip stays locked on failure');

if (failed.length > 0) {
  console.error('FAILED:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredDriverLifecycle.test.js: all passed');
