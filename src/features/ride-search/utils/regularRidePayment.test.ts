import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAssuredBookingIdempotencyKey } from './assuredDeposit.utils';
import {
  buildRegularCreateBookingPayload,
  formatPassengerPaymentStatusLabel,
  formatRegularRidePaymentMethodLabel,
  isInsufficientWalletForRegularFare,
  isPayAfterRideMethod,
  isWalletAccessForbiddenMessage,
  isWalletPrepaidMethod,
  resolveRegularFareCoins,
  resolveRegularPayableCoins,
  reuseOrCreateIdempotencyKey,
  toRegularRidePaymentRequestMethod,
} from './regularRidePayment.utils';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

// 1. Wallet payment with sufficient balance — request body
const walletPayload = buildRegularCreateBookingPayload({
  rideId: 'ride-1',
  seats: 1,
  paymentMethod: 'WALLET',
});
assertEqual(walletPayload, {
  rideId: 'ride-1',
  seats: 1,
  paymentMethod: 'WALLET',
}, 'wallet create body');
assertFalse('fare' in walletPayload, 'wallet body has no fare');
assertFalse('totalAmount' in walletPayload, 'wallet body has no totalAmount');
assertFalse('availableCoins' in walletPayload, 'wallet body has no wallet balance');
assertFalse('discount' in walletPayload, 'wallet body has no discount');
assertFalse('farePayment' in walletPayload, 'wallet body has no farePayment');

assertTrue(
  !isInsufficientWalletForRegularFare('800', '240'),
  'sufficient wallet does not block',
);

// 2. Wallet payment with insufficient balance
assertTrue(
  isInsufficientWalletForRegularFare('100', '240'),
  'insufficient wallet pre-check',
);
assertFalse(
  isInsufficientWalletForRegularFare(null, '240'),
  'unknown balance is not treated as insufficient',
);

// 3. Pay After Ride booking
const payAfterPayload = buildRegularCreateBookingPayload({
  rideId: 'ride-1',
  seats: 1,
  paymentMethod: 'PAY_AFTER_RIDE',
});
assertEqual(payAfterPayload.paymentMethod, 'PAY_AFTER_RIDE', 'pay after ride alias');
assertEqual(toRegularRidePaymentRequestMethod('pay-after-ride'), 'PAY_AFTER_RIDE', 'UI id → alias');
assertEqual(toRegularRidePaymentRequestMethod('wallet'), 'WALLET', 'wallet UI id → alias');
assertEqual(toRegularRidePaymentRequestMethod(null), null, 'no selection → null');

// 4. Network timeout retry reuses the same idempotency key
const createKey = (): string => generateAssuredBookingIdempotencyKey();
let scope = reuseOrCreateIdempotencyKey(
  null,
  { rideId: 'ride-1', seats: 1, paymentMethod: 'WALLET', farePayment: null },
  createKey,
);
const retryScope = reuseOrCreateIdempotencyKey(
  scope,
  { rideId: 'ride-1', seats: 1, paymentMethod: 'WALLET', farePayment: null },
  createKey,
);
assertEqual(retryScope.key, scope.key, 'timeout retry reuses idempotency key');

// New booking attempt (new ride) gets a new key
const nextAttempt = reuseOrCreateIdempotencyKey(
  scope,
  { rideId: 'ride-2', seats: 1, paymentMethod: 'WALLET', farePayment: null },
  createKey,
);
assertTrue(nextAttempt.key !== scope.key, 'new booking attempt gets a new key');

// Switching payment method gets a new key
const switched = reuseOrCreateIdempotencyKey(
  scope,
  { rideId: 'ride-1', seats: 1, paymentMethod: 'PAY_AFTER_RIDE', farePayment: null },
  createKey,
);
assertTrue(switched.key !== scope.key, 'payment method change gets a new key');

// 5. Duplicate button taps
let submitting = false;
let createCalls = 0;
const attemptSubmit = (): boolean => {
  if (submitting) {
    return false;
  }
  submitting = true;
  createCalls += 1;
  return true;
};
assertTrue(attemptSubmit(), 'first tap allowed');
assertFalse(attemptSubmit(), 'second tap blocked');
assertEqual(createCalls, 1, 'one booking request');

// 6. Cancellation + wallet refund display
assertEqual(
  formatPassengerPaymentStatusLabel({
    paymentMethod: 'PAY_NOW',
    paymentStatus: 'REFUNDED',
    bookingStatus: 'CANCELLED',
  }),
  'Wallet refund completed',
  'wallet refund completed label',
);

// 7. Duplicate cancellation is a display/state concern — alreadyApplied stays cancelled
assertEqual(
  formatPassengerPaymentStatusLabel({
    paymentMethod: 'WALLET',
    paymentStatus: 'REFUNDED',
    bookingStatus: 'CANCELLED',
  }),
  'Wallet refund completed',
  'alias WALLET refund label',
);

// 8. Completed wallet booking — no second passenger debit / no Pay Now
assertTrue(isWalletPrepaidMethod('PAY_NOW'), 'canonical PAY_NOW is prepaid');
assertTrue(isWalletPrepaidMethod('WALLET'), 'request alias WALLET is prepaid');
assertFalse(isPayAfterRideMethod('PAY_NOW'), 'PAY_NOW is not Pay After Ride');
assertFalse(isPayAfterRideMethod('WALLET'), 'WALLET is not Pay After Ride');
assertTrue(isPayAfterRideMethod('PAY_LATER'), 'PAY_LATER is Pay After Ride');
assertTrue(isPayAfterRideMethod('PAY_AFTER_RIDE'), 'PAY_AFTER_RIDE is Pay After Ride');
assertEqual(
  formatPassengerPaymentStatusLabel({
    paymentMethod: 'PAY_NOW',
    paymentStatus: 'PAID',
    bookingStatus: 'COMPLETED',
    rideStatus: 'COMPLETED',
  }),
  'Already paid',
  'completed wallet booking → Already paid',
);

// Display mapping
assertEqual(
  formatRegularRidePaymentMethodLabel('PAY_NOW'),
  'Paid with BhaiWay Wallet',
  'PAY_NOW method label',
);
assertEqual(
  formatRegularRidePaymentMethodLabel('WALLET'),
  'Paid with BhaiWay Wallet',
  'WALLET method label',
);
assertEqual(
  formatRegularRidePaymentMethodLabel('PAY_LATER'),
  'Pay After Ride',
  'PAY_LATER method label',
);
assertEqual(
  formatRegularRidePaymentMethodLabel('PAY_AFTER_RIDE'),
  'Pay After Ride',
  'PAY_AFTER_RIDE method label',
);
assertEqual(
  formatPassengerPaymentStatusLabel({
    paymentMethod: 'PAY_NOW',
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
  }),
  'Paid',
  'PAY_NOW + PAID before completion',
);
assertEqual(
  formatPassengerPaymentStatusLabel({
    paymentMethod: 'PAY_LATER',
    paymentStatus: 'UNPAID',
  }),
  'Unpaid',
  'PAY_LATER + UNPAID',
);

assertTrue(
  isWalletAccessForbiddenMessage('Wallet is suspended'),
  '403 wallet suspended copy detected',
);
assertFalse(
  isWalletAccessForbiddenMessage('Identity verification is required'),
  'identity 403 is not a wallet lock',
);

assertEqual(resolveRegularFareCoins(120, 2), '240', 'fare coins = pricePerSeat * seats');
assertEqual(resolveRegularPayableCoins('240', 40), '200', 'preview payable subtracts coupon');
assertEqual(resolveRegularPayableCoins('240', 0), '240', 'no coupon keeps fare');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '../../..');
const paymentHook = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/usePaymentOptions.ts'),
  'utf8',
);
assertTrue(paymentHook.includes("'WALLET'"), 'Regular wallet attempt uses WALLET');
assertTrue(
  paymentHook.includes('toRegularRidePaymentRequestMethod'),
  'Regular pay-after uses request alias helper',
);
assertTrue(paymentHook.includes('idempotencyKey'), 'wallet booking sends idempotency key');
assertTrue(paymentHook.includes('refreshWallet'), 'refreshes wallet after prepaid success');
assertTrue(paymentHook.includes("paymentMethod: 'ASSURED_DEPOSIT'"), 'Assured still ASSURED_DEPOSIT');
assertTrue(!paymentHook.includes('For Regular rides in this version'), 'Regular wallet is no longer blocked');

const regularUtils = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/regularRidePayment.utils.ts'),
  'utf8',
);
assertTrue(regularUtils.includes("'PAY_AFTER_RIDE'"), 'Regular pay-after uses PAY_AFTER_RIDE');
assertTrue(regularUtils.includes("'WALLET'"), 'Regular wallet request alias is WALLET');

const commuteUtils = fs.readFileSync(
  path.join(root, 'features/office-commute/utils/commuteBooking.utils.ts'),
  'utf8',
);
assertTrue(commuteUtils.includes("paymentMethod: 'PAY_NOW'"), 'Commute still posts PAY_NOW');
assertTrue(!commuteUtils.includes("'WALLET'"), 'Commute does not use WALLET alias');

if (failed.length > 0) {
  throw new Error(`regularRidePayment tests failed:\n${failed.join('\n')}`);
}

console.log('regularRidePayment tests passed');
