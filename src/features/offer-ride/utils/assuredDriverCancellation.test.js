/**
 * Phase 1 Assured Driver Cancellation — structural + logic tests.
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

const useCancel = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useCancelUpcomingRide.ts'),
  'utf8',
);
const ridesTypes = fs.readFileSync(
  path.join(root, 'features/offer-ride/api/rides.types.ts'),
  'utf8',
);
const ridesApi = fs.readFileSync(
  path.join(root, 'features/offer-ride/api/rides.api.ts'),
  'utf8',
);
const cancelConstants = fs.readFileSync(
  path.join(root, 'features/my-rides/constants/cancel-upcoming.constants.ts'),
  'utf8',
);
const cancelScreen = fs.readFileSync(
  path.join(root, 'screens/my-rides/CancelUpcomingRideScreen/CancelUpcomingRideScreen.tsx'),
  'utf8',
);
const couponConstants = fs.readFileSync(
  path.join(root, 'features/ride-search/constants/assured-coupon.constants.ts'),
  'utf8',
);

// A. Regular driver cancellation remains on POST /rides/:id/cancel
assertIncludes(useCancel, 'cancelRideById(rideId)', 'driver cancel calls cancelRideById');
assertIncludes(useCancel, 'Regular ride cancelled by driver', 'regular driver log preserved');
assertIncludes(
  useCancel,
  'upcomingRideCancelledStore.setCancelled(false)',
  'driver cancel clears local hide flag',
);

const confirmCancelSection = useCancel.split('const confirmCancel = useCallback')[1] ?? '';
const driverConfirmBranch = confirmCancelSection.split('// Assured passenger')[0] ?? '';

// B. Assured driver cancellation uses same endpoint — no booking payload
assertIncludes(useCancel, 'await cancelDriverRide(summary.assured)', 'unified driver cancel with assured flag');
assertIncludes(useCancel, 'Assured ride cancelled by driver', 'assured driver cancel log');
assertIncludes(ridesApi, 'httpClient.post<CancelRideResultDto>(ENDPOINTS.rides.cancel(id), undefined)', 'empty body POST');
assertNotIncludes(driverConfirmBranch, 'cancelBookingById', 'assured driver does not cancel booking');

// C. Successful Assured cancellation refreshes lists + wallet
assertIncludes(useCancel, 'driverRidesRefreshStore.bump()', 'bumps driver rides refresh');
assertIncludes(useCancel, 'getWalletBalance()', 'refreshes wallet balance after assured cancel');
assertIncludes(useCancel, 'walletStore.bumpTransactionsRefresh()', 'bumps wallet transactions');
assertIncludes(useCancel, 'listMyRides()', 'refreshes driver rides list');
assertIncludes(useCancel, 'listDriverBookings', 'refreshes driver bookings');

// D. Idempotent alreadyApplied
assertIncludes(useCancel, 'isRideCancelAlreadyApplied(result)', 'checks alreadyApplied on success payload');
assertIncludes(useCancel, 'isRideCancelAlreadyApplied(details', 'checks alreadyApplied on error details');

// E. Backend compensation fields typed — not computed on mobile
assertIncludes(ridesTypes, 'export interface AssuredRideLifecycleResponse', 'AssuredRideLifecycleResponse type');
assertIncludes(ridesTypes, 'driverDepositForfeited', 'driverDepositForfeited field');
assertIncludes(ridesTypes, 'riderCompensationTotal', 'riderCompensationTotal field');
assertIncludes(ridesTypes, 'fareRefundedTotal', 'fareRefundedTotal field');
assertIncludes(ridesTypes, 'couponsIssuedCount', 'couponsIssuedCount field');
assertNotIncludes(useCancel, 'driverDepositForfeited *', 'no local deposit math');
assertNotIncludes(useCancel, '0.6', 'no 60% split on mobile');

// F/G. PAY_NOW vs PAY_LATER — backend fields only, separate fare refund
assertIncludes(useCancel, 'fareRefundedTotal: result.fareRefundedTotal', 'logs fare refund separately');
assertNotIncludes(useCancel, 'fareRefundedTotal + riderCompensationTotal', 'no double-counting');

// H. Coupon mapping — deposit-only, not fare
assertIncludes(couponConstants, "NEXT_ASSURED_DEPOSIT_FREE", 'coupon type constant');
assertIncludes(couponConstants, 'Deposit-Free Assured Ride', 'coupon display title');
assertIncludes(couponConstants, 'appliesToFare: false', 'coupon does not reduce fare');
assertIncludes(couponConstants, 'appliesToDeposit: true', 'coupon applies to deposit only');

// I. No-Show unchanged
assertNotIncludes(useCancel, 'noShow', 'no no-show logic in cancel hook');
assertNotIncludes(useCancel, 'no-show', 'no no-show logic in cancel hook');

// Driver UI — assured deposit forfeiture warning
assertIncludes(cancelConstants, 'headingDrivingAssured', 'assured driver heading');
assertIncludes(cancelConstants, 'security deposit will be forfeited', 'deposit forfeiture copy');
assertIncludes(cancelScreen, 'showAssuredDriverWarning', 'screen uses assured driver warning');
assertIncludes(cancelScreen, 'keepLabel', 'Keep Ride button');
assertNotIncludes(cancelConstants, '60%', 'no platform split in driver copy');
assertNotIncludes(cancelConstants, '40%', 'no platform split in driver copy');

// Assured driver does not use DemoData local cancel
assertNotIncludes(useCancel, 'DemoData', 'no DemoData in cancel hook');

if (failed.length > 0) {
  console.error('assuredDriverCancellation tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredDriverCancellation tests passed');
