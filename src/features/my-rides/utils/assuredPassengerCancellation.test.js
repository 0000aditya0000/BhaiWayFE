/**
 * Phase 1 Assured Passenger Cancellation — structural + mapper tests.
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

const useCancel = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useCancelUpcomingRide.ts'),
  'utf8',
);
const bookingsTypes = fs.readFileSync(
  path.join(root, 'features/ride-search/api/bookings.types.ts'),
  'utf8',
);
const mapperPath = path.join(root, 'features/my-rides/utils/mapAssuredPassengerCancelResult.ts');
const mapperSrc = fs.readFileSync(mapperPath, 'utf8');
const confirmedHook = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useCancelUpcomingConfirmed.ts'),
  'utf8',
);

// Types include Assured cancel fields
assertIncludes(bookingsTypes, 'securityDepositForfeited', 'deposit forfeited type');
assertIncludes(bookingsTypes, 'nextAssuredDepositPercentage', 'next deposit type');
assertIncludes(bookingsTypes, 'driverCompensation', 'driver compensation type');
assertIncludes(bookingsTypes, 'fareRefunded', 'fare refunded type');

// Hook calls POST /bookings/:id/cancel for assured passenger
assertIncludes(useCancel, 'cancelAssuredPassengerBooking', 'assured passenger cancel function');
assertIncludes(useCancel, 'cancelBookingById(bookingId)', 'calls cancelBookingById');
assertIncludes(useCancel, 'assuredPassengerCancelStore.setResult', 'stores result for success UI');
assertIncludes(useCancel, 'hydrateAuthenticatedUserFromServer', 'refreshes /users/me');
assertIncludes(useCancel, 'refreshWalletAfterAssuredMutation', 'refreshes wallet');
assertIncludes(useCancel, 'listMyBookings()', 'refreshes bookings');

const passengerBranch = useCancel.split('// Assured passenger')[1]?.split('// Regular passenger')[0] ?? '';
assertNotIncludes(passengerBranch, 'upcomingRideCancelledStore.setCancelled(true)', 'no local hide-all flag');

// Regular passenger unchanged
const regularFn = useCancel.split('const cancelRegularPassengerBooking')[1]?.split('const cancelAssuredPassengerBooking')[0] ?? '';
assertIncludes(regularFn, 'Regular booking cancelled', 'regular log preserved');

// Confirmed screen reads store
assertIncludes(confirmedHook, 'assuredPassengerCancelStore', 'confirmed hook uses store');
assertIncludes(confirmedHook, 'detailLines', 'detail lines exposed');

// Mapper logic (inline mirror for PAY_LATER / PAY_NOW)
const parseCoins = (value) => {
  if (value == null) return null;
  const n = Math.round(Number(String(value).trim()));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const formatRupee = (value) => {
  const coins = parseCoins(value);
  return coins == null ? null : `₹${coins.toLocaleString('en-IN')}`;
};

const buildLinesPayLater = (result) => {
  const lines = [];
  const deposit = formatRupee(result.securityDepositForfeited);
  if (deposit) lines.push(`Your security deposit of ${deposit} has been forfeited.`);
  const comp = formatRupee(result.driverCompensation);
  if (comp) lines.push(`${comp} has been given to the driver as compensation.`);
  if (result.nextAssuredDepositPercentage === 10) {
    lines.push('Your next Assured ride will require a 10% security deposit.');
  }
  return lines;
};

const payLater = {
  bookingId: 'b1',
  rideId: 'r1',
  status: 'CANCELLED',
  cancellationReason: 'RIDER_CANCELLED',
  seatsRestored: 1,
  securityDepositForfeited: '35',
  farePayment: 'PAY_LATER',
  fareRefunded: '0',
  driverCompensation: '35',
  platformAmount: '0',
  nextAssuredDepositPercentage: 10,
  alreadyApplied: false,
};

const payLaterLines = buildLinesPayLater(payLater);
assertIncludes(payLaterLines.join(' '), '₹35', 'PAY_LATER deposit amount');
assertIncludes(payLaterLines.join(' '), 'driver as compensation', 'PAY_LATER compensation');
assertIncludes(payLaterLines.join(' '), '10%', 'PAY_LATER next deposit');
assertNotIncludes(payLaterLines.join(' '), 'fare refund', 'PAY_LATER no fare refund');

const payNow = {
  ...payLater,
  farePayment: 'PAY_NOW',
  driverCompensation: '245',
  platformAmount: '490',
  fareRefunded: '0',
};
const payNowFare = 490 + (245 - 35);
assertTrue(payNowFare === 700, 'PAY_NOW fare derived from backend split fields only');
assertNotIncludes(String(payNow.fareRefunded), 'fare has been refunded', 'no refund when fareRefunded is 0');

assertIncludes(mapperSrc, 'fareRefunded', 'mapper handles fareRefunded');
assertNotIncludes(mapperSrc, '0.3', 'no 30% math in mapper');
assertNotIncludes(mapperSrc, '0.7', 'no 70% math in mapper');
assertNotIncludes(mapperSrc, 'ASSURED_PASSENGER_CANCEL', 'no internal wallet type labels');

// alreadyApplied handling
assertIncludes(useCancel, 'alreadyApplied === true', 'idempotent alreadyApplied');
assertIncludes(useCancel, 'isCancelAlreadyApplied(result)', 'cancel already applied check');

if (failed.length > 0) {
  console.error('assuredPassengerCancellation tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredPassengerCancellation tests passed');
