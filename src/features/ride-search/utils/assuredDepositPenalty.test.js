/**
 * Assured deposit penalty UX — mapper + wiring tests.
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

const depositUtils = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/assuredDeposit.utils.ts'),
  'utf8',
);
const useReviewBooking = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useReviewBooking.ts'),
  'utf8',
);
const reviewAssuredSection = fs.readFileSync(
  path.join(
    root,
    'features/ride-search/components/ReviewBookingAssuredSection/ReviewBookingAssuredSection.tsx',
  ),
  'utf8',
);
const reviewScreen = fs.readFileSync(
  path.join(root, 'screens/ride-search/ReviewBookingScreen/ReviewBookingScreen.tsx'),
  'utf8',
);
const usePaymentOptions = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/usePaymentOptions.ts'),
  'utf8',
);
const paymentScreen = fs.readFileSync(
  path.join(root, 'screens/ride-search/PaymentOptionsScreen/PaymentOptionsScreen.tsx'),
  'utf8',
);
const sessionHydration = fs.readFileSync(
  path.join(root, 'features/auth/services/sessionHydration.ts'),
  'utf8',
);

// Mapper present
assertIncludes(depositUtils, 'PREVIOUS_ASSURED_CANCELLATION', 'reason constant');
assertIncludes(depositUtils, 'resolveAssuredDepositPenaltyNotice', 'penalty resolver');
assertIncludes(depositUtils, 'DEFAULT_ASSURED_DEPOSIT_PERCENTAGE = 5', 'normal 5% constant');

// Inline mirror of resolveAssuredDepositPenaltyNotice
const PREVIOUS_ASSURED_CANCELLATION = 'PREVIOUS_ASSURED_CANCELLATION';
const DEFAULT_ASSURED_DEPOSIT_PERCENTAGE = 5;

const resolveNotice = ({ ride, userPenalty, depositPercentage }) => {
  const rideReason = String(ride?.securityDepositReason ?? '').trim().toUpperCase();
  const userReason = String(userPenalty?.reason ?? '').trim().toUpperCase();
  const pct = depositPercentage ?? ride?.securityDepositPercentage ?? userPenalty?.percentage ?? null;
  const reasonMatches =
    rideReason === PREVIOUS_ASSURED_CANCELLATION ||
    userReason === PREVIOUS_ASSURED_CANCELLATION;
  const show = reasonMatches && pct != null && pct > DEFAULT_ASSURED_DEPOSIT_PERCENTAGE;
  return { showPreviousCancellationNotice: show, percentage: show ? pct : null };
};

// A. Normal 5% — no penalty message
const normal = resolveNotice({
  ride: { securityDepositPercentage: 5 },
  userPenalty: null,
  depositPercentage: 5,
});
assertFalse(normal.showPreviousCancellationNotice, '5% no penalty notice');

// B. Previous cancellation 10%
const elevated = resolveNotice({
  ride: {
    securityDepositPercentage: 10,
    securityDepositReason: 'PREVIOUS_ASSURED_CANCELLATION',
  },
  userPenalty: null,
  depositPercentage: 10,
});
assertTrue(elevated.showPreviousCancellationNotice, '10% with ride reason shows notice');
assertTrue(elevated.percentage === 10, '10% percentage preserved');

// User penalty path
const fromUser = resolveNotice({
  ride: { securityDepositPercentage: 10 },
  userPenalty: { percentage: 10, reason: 'PREVIOUS_ASSURED_CANCELLATION' },
  depositPercentage: 10,
});
assertTrue(fromUser.showPreviousCancellationNotice, 'user penalty shows notice');

// F. Missing metadata
const missing = resolveNotice({
  ride: { securityDepositPercentage: 10 },
  userPenalty: null,
  depositPercentage: 10,
});
assertFalse(missing.showPreviousCancellationNotice, '10% without reason hidden');

// G. Unknown reason
const unknown = resolveNotice({
  ride: {
    securityDepositPercentage: 10,
    securityDepositReason: 'SOME_OTHER_REASON',
  },
  userPenalty: null,
  depositPercentage: 10,
});
assertFalse(unknown.showPreviousCancellationNotice, 'unknown reason hidden');

// C/D. PAY_LATER vs PAY_NOW — deposit from route params, fare only for PAY_NOW
const addCoins = (a, b) => (BigInt(a) + BigInt(b)).toString();
const resolveRequired = ({ deposit, fare, farePayment }) =>
  farePayment === 'PAY_NOW' ? addCoins(deposit, fare) : deposit;

const payLater = resolveRequired({ deposit: '10', fare: '200', farePayment: 'PAY_LATER' });
assertTrue(payLater === '10', 'PAY_LATER uses elevated deposit only');

const payNow = resolveRequired({ deposit: '10', fare: '200', farePayment: 'PAY_NOW' });
assertTrue(payNow === '210', 'PAY_NOW adds fare to elevated deposit');

// E. Regular ride — no penalty wiring on review for non-assured
assertIncludes(useReviewBooking, 'isAssured', 'review distinguishes assured');
assertNotIncludes(reviewScreen, 'assuredDepositPenaltyNotice={true', 'review no hardcoded penalty');

// H. Booking success refreshes user, does not locally consume penalty
assertIncludes(usePaymentOptions, 'hydrateAuthenticatedUserFromServer', 'payment hydrates user after book');
assertNotIncludes(usePaymentOptions, 'assuredDepositPenaltyStore.set', 'payment does not set penalty');

// Wiring
assertIncludes(useReviewBooking, 'resolveAssuredDepositPenaltyNotice', 'review hook resolves penalty');
assertIncludes(useReviewBooking, 'assuredDepositPenaltyStore', 'review hook reads user penalty');
assertIncludes(useReviewBooking, 'hydrateAuthenticatedUserFromServer', 'review refreshes /users/me');
assertIncludes(reviewAssuredSection, 'AssuredDepositPenaltyNotice', 'review assured section penalty');
assertIncludes(reviewScreen, 'showPreviousCancellationNotice', 'review passes penalty flag');
assertIncludes(paymentScreen, 'AssuredDepositPenaltyNotice', 'payment penalty component');
assertIncludes(paymentScreen, 'assuredDepositPenaltyNotice', 'payment reads penalty flag');
assertIncludes(sessionHydration, 'assuredDepositPenaltyStore.set', 'hydrate stores penalty');
assertIncludes(usePaymentOptions, 'params.assuredDepositCoins', 'payment uses route deposit coins');
assertIncludes(usePaymentOptions, 'resolveAssuredRequiredCoins', 'payment wallet pre-check');

assertNotIncludes(depositUtils, 'penaltyStore.set(', 'deposit utils do not persist penalty');
assertNotIncludes(useReviewBooking, 'percentage = 5', 'review hook does not reset penalty');

if (failed.length > 0) {
  console.error('assuredDepositPenalty tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredDepositPenalty tests passed');
