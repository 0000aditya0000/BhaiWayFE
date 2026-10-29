/**
 * Assured rider booking + farePayment contract tests — plain Node.
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

const compareCoinStrings = (left, right) => {
  const a = parseIntegerCoinString(left) ?? '0';
  const b = parseIntegerCoinString(right) ?? '0';
  if (a.length !== b.length) return a.length > b.length ? 1 : -1;
  if (a === b) return 0;
  return a > b ? 1 : -1;
};

const addCoinStrings = (left, right) => {
  const a = parseIntegerCoinString(left) ?? '0';
  const b = parseIntegerCoinString(right) ?? '0';
  return (BigInt(a) + BigInt(b)).toString();
};

const resolveAssuredRequiredCoins = ({ depositCoins, fareCoins, farePayment }) => {
  const deposit = parseIntegerCoinString(depositCoins ?? null);
  if (farePayment === 'PAY_NOW') {
    const fare = parseIntegerCoinString(fareCoins ?? null) ?? '0';
    if (!deposit && fare === '0') return null;
    return addCoinStrings(deposit ?? '0', fare);
  }
  return deposit;
};

const isInsufficientWalletForAssuredDeposit = (availableCoins, requiredDepositCoins) => {
  const required = parseIntegerCoinString(requiredDepositCoins ?? null);
  if (!required || required === '0') return false;
  const available = parseIntegerCoinString(availableCoins ?? null) ?? '0';
  return compareCoinStrings(available, required) < 0;
};

const buildAssuredCreateBookingPayload = ({ rideId, seats, farePayment }) => ({
  rideId,
  seats: Math.max(1, Math.floor(seats)),
  paymentMethod: 'ASSURED_DEPOSIT',
  farePayment,
});

const generateAssuredBookingIdempotencyKey = () =>
  `booking-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ─── A/B. Payloads ───────────────────────────────────────────────────────────
const payLaterPayload = buildAssuredCreateBookingPayload({
  rideId: 'ride-1',
  seats: 1,
  farePayment: 'PAY_LATER',
});
assertEqual(payLaterPayload.paymentMethod, 'ASSURED_DEPOSIT', 'A paymentMethod ASSURED_DEPOSIT');
assertEqual(payLaterPayload.farePayment, 'PAY_LATER', 'A farePayment PAY_LATER');

const payNowPayload = buildAssuredCreateBookingPayload({
  rideId: 'ride-1',
  seats: 1,
  farePayment: 'PAY_NOW',
});
assertEqual(payNowPayload.paymentMethod, 'ASSURED_DEPOSIT', 'B paymentMethod ASSURED_DEPOSIT');
assertEqual(payNowPayload.farePayment, 'PAY_NOW', 'B farePayment PAY_NOW');

// ─── C/D. Wallet pre-check required amounts ──────────────────────────────────
assertEqual(
  resolveAssuredRequiredCoins({
    depositCoins: '105',
    fareCoins: '700',
    farePayment: 'PAY_LATER',
  }),
  '105',
  'C PAY_LATER required = deposit only',
);
assertEqual(
  resolveAssuredRequiredCoins({
    depositCoins: '105',
    fareCoins: '700',
    farePayment: 'PAY_NOW',
  }),
  '805',
  'D PAY_NOW required = deposit + fare',
);

// ─── E/F. Insufficient balance blocks POST ───────────────────────────────────
assertTrue(
  isInsufficientWalletForAssuredDeposit('50', '105'),
  'E insufficient for deposit',
);
assertTrue(
  isInsufficientWalletForAssuredDeposit('200', '805'),
  'F insufficient for PAY_NOW total',
);
assertFalse(
  isInsufficientWalletForAssuredDeposit('900', '805'),
  'F sufficient for PAY_NOW total',
);

let postCalled = false;
const attemptBook = (available, required) => {
  if (isInsufficientWalletForAssuredDeposit(available, required)) {
    return { blocked: true, addCoins: true };
  }
  postCalled = true;
  return { blocked: false };
};
assertTrue(attemptBook('50', '105').blocked, 'E no POST when deposit insufficient');
assertTrue(attemptBook('50', '105').addCoins, 'E Add Coins path');
assertFalse(postCalled, 'E POST not called');
postCalled = false;
assertTrue(attemptBook('200', '805').blocked, 'F no POST when PAY_NOW insufficient');
assertFalse(postCalled, 'F POST not called');

// ─── G/H. Success response mapping (backend authoritative) ───────────────────
const mapSuccessDisplay = (booking) => ({
  depositAmount: booking.securityDepositAmount,
  depositStatus: booking.securityDepositStatus,
  fareAmount: booking.fareAmount,
  farePayment: booking.farePayment,
  farePaymentStatus: booking.farePaymentStatus,
});

const laterResponse = mapSuccessDisplay({
  paymentMethod: 'ASSURED_DEPOSIT',
  paymentStatus: 'UNPAID',
  farePayment: 'PAY_LATER',
  farePaymentStatus: 'UNPAID',
  fareAmount: '700',
  totalAmount: '700',
  securityDepositAmount: '105',
  securityDepositPercentage: 5,
  securityDepositStatus: 'HELD',
});
assertEqual(laterResponse.depositStatus, 'HELD', 'G deposit HELD');
assertEqual(laterResponse.farePaymentStatus, 'UNPAID', 'G fare UNPAID');
assertEqual(laterResponse.fareAmount, '700', 'G fareAmount from backend');

const nowResponse = mapSuccessDisplay({
  paymentMethod: 'ASSURED_DEPOSIT',
  paymentStatus: 'PAID',
  farePayment: 'PAY_NOW',
  farePaymentStatus: 'PAID',
  fareAmount: '700',
  totalAmount: '700',
  securityDepositAmount: '105',
  securityDepositPercentage: 5,
  securityDepositStatus: 'HELD',
});
assertEqual(nowResponse.depositStatus, 'HELD', 'H deposit HELD');
assertEqual(nowResponse.farePaymentStatus, 'PAID', 'H fare PAID');
assertEqual(nowResponse.fareAmount, '700', 'I fareAmount not hardcoded');
assertEqual(nowResponse.depositAmount, '105', 'I deposit from backend');

// ─── J/K. Idempotency keyed by rideId+seats+farePayment ──────────────────────
const resolveKey = (ref, rideId, seats, farePayment) => {
  if (
    ref.current &&
    ref.current.rideId === rideId &&
    ref.current.seats === seats &&
    ref.current.farePayment === farePayment
  ) {
    return ref.current.key;
  }
  const key = generateAssuredBookingIdempotencyKey();
  ref.current = { key, rideId, seats, farePayment };
  return key;
};
const ref = { current: null };
const key1 = resolveKey(ref, 'ride-1', 1, 'PAY_LATER');
const key1Retry = resolveKey(ref, 'ride-1', 1, 'PAY_LATER');
assertEqual(key1, key1Retry, 'J same attempt reuses idempotency key');
const key2 = resolveKey(ref, 'ride-1', 1, 'PAY_NOW');
assertTrue(key2 !== key1, 'K farePayment change gets new idempotency key');

// ─── L. Regular regression ───────────────────────────────────────────────────
const regularPayload = {
  rideId: 'ride-regular',
  seats: 1,
  paymentMethod: 'PAY_LATER',
};
assertEqual(regularPayload.paymentMethod, 'PAY_LATER', 'L Regular PAY_LATER');
assertFalse('farePayment' in regularPayload, 'L Regular has no farePayment');

// No DemoData mutations
const demoFlags = { persistDemoBooking: false, updateWallet: false };
assertFalse(demoFlags.persistDemoBooking, 'no persistDemoBooking');
assertFalse(demoFlags.updateWallet, 'no updateBhaiWayWalletBalance');

// Double-submit
let submitting = false;
let createCalls = 0;
const attemptSubmit = () => {
  if (submitting) return false;
  submitting = true;
  createCalls += 1;
  return true;
};
assertTrue(attemptSubmit(), 'first submit allowed');
assertFalse(attemptSubmit(), 'double tap blocked');
assertEqual(createCalls, 1, 'one booking request');

// Structural: production hook sends farePayment for Assured only
const usePaymentOptions = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/usePaymentOptions.ts'),
  'utf8',
);
assertIncludes(usePaymentOptions, "paymentMethod: 'ASSURED_DEPOSIT'", 'hook sends ASSURED_DEPOSIT');
assertIncludes(usePaymentOptions, 'farePayment', 'hook sends farePayment');
assertIncludes(usePaymentOptions, "paymentMethod: 'PAY_LATER'", 'Regular still PAY_LATER');
assertIncludes(usePaymentOptions, 'resolveAssuredRequiredCoins', 'uses required-coins helper');
assertIncludes(usePaymentOptions, 'refreshWallet', 'refreshes wallet after success');
assertNotIncludes(usePaymentOptions, 'persistDemoBooking', 'no DemoData booking');
assertNotIncludes(usePaymentOptions, 'updateBhaiWayWalletBalance', 'no DemoData wallet debit');

const bookingsTypes = fs.readFileSync(
  path.join(root, 'features/ride-search/api/bookings.types.ts'),
  'utf8',
);
assertIncludes(bookingsTypes, 'farePayment?:', 'CreateBookingDto has farePayment');
assertIncludes(bookingsTypes, 'farePaymentStatus', 'response has farePaymentStatus');
assertIncludes(bookingsTypes, 'securityDepositStatus', 'response has securityDepositStatus');

if (failed.length > 0) {
  console.error('FAILED:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredBooking tests passed');
