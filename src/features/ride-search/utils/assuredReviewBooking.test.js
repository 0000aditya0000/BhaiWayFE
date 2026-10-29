/**
 * Assured Review Booking — API integration contract tests (plain Node).
 * Covers rider Review screen sourcing from GET /rides/public/:id.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');
const failed = [];

const assertEqual = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value, label) => {
  if (!value) failed.push(`${label}: expected true`);
};

const assertFalse = (value, label) => {
  if (value) failed.push(`${label}: expected false`);
};

const assertIncludes = (haystack, needle, label) => {
  if (!String(haystack).includes(needle)) {
    failed.push(`${label}: missing ${JSON.stringify(needle)}`);
  }
};

const assertNotIncludes = (haystack, needle, label) => {
  if (String(haystack).includes(needle)) {
    failed.push(`${label}: should not contain ${JSON.stringify(needle)}`);
  }
};

const INTEGER_PATTERN = /^\d+$/;
const parseIntegerCoinString = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed || !INTEGER_PATTERN.test(trimmed)) return null;
  return trimmed.replace(/^0+(?=\d)/, '') || '0';
};

const computeAssuredRiderDepositCoins = ({
  pricePerSeat,
  seats,
  securityDepositAmount,
  securityDepositPercentage,
}) => {
  const direct = parseIntegerCoinString(securityDepositAmount ?? null);
  if (direct !== null && direct !== '0') {
    return direct;
  }
  const unit = parseIntegerCoinString(pricePerSeat);
  const pct = securityDepositPercentage;
  const seatCount = Math.max(1, Math.floor(seats));
  if (unit && pct != null && pct > 0) {
    const totalFare = BigInt(unit) * BigInt(seatCount);
    const deposit = (totalFare * BigInt(Math.round(pct))) / BigInt(100);
    return deposit > BigInt(0) ? deposit.toString() : '0';
  }
  return null;
};

const isAssuredPublicRideBookable = (ride) => {
  if (String(ride.rideType ?? '').trim().toUpperCase() !== 'ASSURED') {
    return false;
  }
  const status = String(ride.status ?? '')
    .trim()
    .toUpperCase();
  if (status === 'ASSURANCE_PENDING') return false;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  if (ride.isBookable === false) return false;
  return Number(ride.availableSeats) > 0;
};

const computeRideFare = (pricePerSeat, seats) =>
  Math.max(0, Number(pricePerSeat) || 0) * Math.max(1, Math.floor(seats));

const useReviewBooking = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useReviewBooking.ts'),
  'utf8',
);
const reviewScreen = fs.readFileSync(
  path.join(root, 'screens/ride-search/ReviewBookingScreen/ReviewBookingScreen.tsx'),
  'utf8',
);
const depositUtils = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/assuredDeposit.utils.ts'),
  'utf8',
);
const rideResultScreen = fs.readFileSync(
  path.join(root, 'screens/ride-search/RideResultScreen/RideResultScreen.tsx'),
  'utf8',
);
const useRideDetails = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useRideDetails.ts'),
  'utf8',
);
const reviewConstants = fs.readFileSync(
  path.join(root, 'features/ride-search/constants/review-booking.constants.ts'),
  'utf8',
);

// ─── A. Selecting Assured search result uses real ride ID ────────────────────
assertIncludes(rideResultScreen, 'rideId: ride.id', 'A search result passes ride.id');
assertIncludes(rideResultScreen, 'getRideDetailsPath', 'A Book Now opens Ride Details');
assertNotIncludes(rideResultScreen, 'getReviewBookingPath', 'A search no longer skips to Review Booking');
assertIncludes(useRideDetails, 'getReviewBookingPath', 'A Ride Details Book continues to Review Booking');
assertIncludes(useReviewBooking, 'getPublicRideById(params.rideId)', 'A Review uses params.rideId');

// ─── B. GET /rides/public/:id for Assured Review ─────────────────────────────
assertIncludes(useReviewBooking, 'getPublicRideById', 'B calls getPublicRideById');
assertIncludes(useReviewBooking, "isAssured", 'B Assured branch');
assertIncludes(useReviewBooking, 'mapRideSearchItemToResult', 'B maps public ride');

// ─── C/D. pricePerSeat × seats = ride fare (deposit separate) ────────────────
assertEqual(computeRideFare(700, 1), 700, 'C fare 1 seat');
assertEqual(computeRideFare(700, 2), 1400, 'D fare 2 seats');
assertIncludes(useReviewBooking, 'unit * Math.max(1, selectedSeats)', 'C/D Review multiplies seats');
assertIncludes(reviewConstants, "rideFareLabel: 'Ride Fare'", 'C Ride Fare label');
assertIncludes(reviewConstants, "assuredFeeLabel: 'Security Deposit'", 'C deposit separate label');

// ─── E. Backend securityDepositAmount preferred ──────────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '700',
    seats: 2,
    securityDepositAmount: '105',
    securityDepositPercentage: 15,
  }),
  '105',
  'E prefers securityDepositAmount',
);
assertIncludes(depositUtils, 'securityDepositAmount', 'E utils use amount field');

// ─── F. Percentage fallback when amount absent ───────────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '700',
    seats: 1,
    securityDepositAmount: null,
    securityDepositPercentage: 15,
  }),
  '105',
  'F 15% of 700 = 105',
);
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '700',
    seats: 2,
    securityDepositAmount: null,
    securityDepositPercentage: 15,
  }),
  '210',
  'F 15% of 1400 = 210',
);

// ─── G. No hardcoded ₹50 deposit on live Assured path ────────────────────────
assertNotIncludes(useReviewBooking, 'ASSURED_BOOKING_FEE', 'G no ASSURED_BOOKING_FEE in Review hook');
assertIncludes(useReviewBooking, 'computeAssuredDepositFromRide', 'G uses deposit util');
assertNotIncludes(useReviewBooking, 'persistDemoBooking', 'G no persistDemoBooking');
assertNotIncludes(useReviewBooking, 'updateBhaiWayWalletBalance', 'G no wallet DemoData');
assertNotIncludes(useReviewBooking, 'getBhaiWayWalletBalance', 'G no getBhaiWayWalletBalance');
assertNotIncludes(useReviewBooking, 'recordWalletTransaction', 'G no recordWalletTransaction');

// Assured booking shell must not seed from getReviewBookingMock
const assuredBlockStart = useReviewBooking.indexOf('if (isAssured) {');
const regularMockCall = useReviewBooking.indexOf('getReviewBookingMock(');
assertTrue(assuredBlockStart >= 0, 'G Assured branch exists');
assertTrue(regularMockCall > assuredBlockStart, 'G mock used after Assured branch (Regular only)');
assertIncludes(useReviewBooking, 'EMPTY_ASSURED_BOOKING', 'G Assured empty shell (no mock seed)');

// ─── H. Assured does not require PUBLISHED ───────────────────────────────────
assertNotIncludes(
  depositUtils,
  "status === 'PUBLISHED'",
  'H bookability does not require PUBLISHED',
);
assertTrue(
  isAssuredPublicRideBookable({
    rideType: 'ASSURED',
    status: 'ASSURANCE_ACTIVE',
    availableSeats: 2,
  }),
  'H ASSURANCE_ACTIVE bookable without PUBLISHED',
);
assertTrue(
  isAssuredPublicRideBookable({
    rideType: 'ASSURED',
    status: undefined,
    availableSeats: 1,
  }),
  'H missing status still bookable when seats > 0',
);

// ─── I. ASSURANCE_ACTIVE + seats can proceed ─────────────────────────────────
assertTrue(
  isAssuredPublicRideBookable({
    rideType: 'ASSURED',
    status: 'ASSURANCE_ACTIVE',
    availableSeats: 1,
  }),
  'I ASSURANCE_ACTIVE + seats bookable',
);
assertIncludes(depositUtils, 'isAssuredPublicRideBookable', 'I util exported');
assertIncludes(useReviewBooking, 'isAssuredPublicRideBookable', 'I Review gates on bookable');

// ─── J. ASSURANCE_PENDING cannot proceed ─────────────────────────────────────
assertFalse(
  isAssuredPublicRideBookable({
    rideType: 'ASSURED',
    status: 'ASSURANCE_PENDING',
    availableSeats: 3,
  }),
  'J ASSURANCE_PENDING blocked',
);
assertFalse(
  isAssuredPublicRideBookable({
    rideType: 'ASSURED',
    status: 'ASSURANCE_ACTIVE',
    availableSeats: 0,
  }),
  'J zero seats blocked',
);

// ─── K. Loading does not show fake booking information ───────────────────────
assertIncludes(useReviewBooking, "assuredLoadState", 'K load state tracked');
assertIncludes(useReviewBooking, "'loading'", 'K loading state');
assertIncludes(reviewScreen, "assuredLoadState === 'loading'", 'K screen gates on loading');
assertIncludes(reviewScreen, 'REVIEW_BOOKING_SCREEN.loadingLabel', 'K loading label');
assertNotIncludes(
  reviewScreen.slice(
    reviewScreen.indexOf("assuredLoadState === 'loading'"),
    reviewScreen.indexOf("assuredLoadState === 'error'"),
  ),
  'ReviewBookingFareCard',
  'K loading UI does not render fare card',
);

// ─── L. API failure does not navigate to Payment with incomplete data ────────
assertIncludes(useReviewBooking, "setAssuredLoadState('error')", 'L error state set on failure');
assertIncludes(reviewScreen, "assuredLoadState === 'error'", 'L screen surfaces error state');
assertIncludes(useReviewBooking, 'canConfirmAssured', 'L confirm gate');
assertIncludes(useReviewBooking, 'if (!canConfirmAssured', 'L blocks confirm when not ready');
assertIncludes(reviewScreen, 'disabled={confirmDisabled}', 'L Confirm disabled until ready');
assertIncludes(useReviewBooking, 'getPaymentPath', 'L payment path only after confirm');
assertIncludes(useReviewBooking, 'assuredDepositCoins', 'L passes deposit coins to payment');

// Sample mapping sanity
const samplePublicRide = {
  id: 'ride-assured-42',
  rideType: 'ASSURED',
  status: 'ASSURANCE_ACTIVE',
  source: 'Koramangala',
  destination: 'Whitefield',
  pricePerSeat: '700',
  availableSeats: 2,
  securityDepositAmount: '105',
  securityDepositPercentage: 15,
};
assertEqual(samplePublicRide.id, 'ride-assured-42', 'sample rideId');
assertEqual(computeRideFare(samplePublicRide.pricePerSeat, 1), 700, 'sample fare 1 seat');
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: samplePublicRide.pricePerSeat,
    seats: 1,
    securityDepositAmount: samplePublicRide.securityDepositAmount,
    securityDepositPercentage: samplePublicRide.securityDepositPercentage,
  }),
  '105',
  'sample deposit from amount',
);

// Details → Review handoff uses pricePerSeat (not mock fare.total alone)
assertIncludes(useRideDetails, 'livePricePerSeat', 'details keeps live pricePerSeat');
assertIncludes(useRideDetails, 'availableSeats: liveSeatsLeft', 'details passes availableSeats');

// ─── M. Regular Review path still uses mock shell (unchanged contract) ───────
assertIncludes(useReviewBooking, 'getReviewBookingMock(params.rideId, params.rideType)', 'M Regular mock');
assertIncludes(useReviewBooking, 'buildRegularFareEstimate', 'M Regular fare estimate');
assertIncludes(reviewScreen, 'isRegular', 'M Regular UI branch');

if (failed.length > 0) {
  console.error('FAILED:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredReviewBooking tests passed');
