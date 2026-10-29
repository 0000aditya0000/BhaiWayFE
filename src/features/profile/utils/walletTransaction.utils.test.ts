/**
 * Wallet transaction normalization tests — Node via tsx.
 */
import { normalizeWalletTransactionDto, normalizeWalletTransactionList } from '../api/walletTransaction.utils';
import {
  mapTransactionCategoryIcon,
  mapWalletTransactionDisplay,
  mapWalletTransactionVisual,
  resolveWalletTransactionTitle,
} from './mapWalletTransaction';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const commuteBooking = normalizeWalletTransactionDto({
  transactionId: 'tx-commute-book',
  transactionType: 'BOOKING_PAYMENT',
  direction: 'DEBIT',
  amount: '220',
  balanceBefore: '1000',
  balanceAfter: '780',
  pointSource: null,
  status: 'POSTED',
  displayTitle: 'Office commute booked',
  displayCategory: 'BOOKING',
  referenceType: 'BOOKING',
  referenceId: 'booking-uuid',
  rideId: 'ride-uuid',
  rideType: 'COMMUTE',
  createdAt: '2026-09-02T00:55:10.123Z',
});
assertEqual(commuteBooking?.displayTitle, 'Office commute booked', 'commute displayTitle');
assertEqual(commuteBooking?.displayCategory, 'BOOKING', 'commute displayCategory');
assertEqual(
  mapWalletTransactionDisplay(commuteBooking!).title,
  'Office commute booked',
  'commute uses backend displayTitle',
);
assertEqual(
  mapWalletTransactionDisplay(commuteBooking!).subtitle,
  undefined,
  'commute displayTitle suppresses ride subtitle',
);
assertEqual(
  mapWalletTransactionVisual(commuteBooking!).icon,
  'car',
  'BOOKING category uses car icon',
);

const commuteRefund = normalizeWalletTransactionDto({
  transactionId: 'tx-commute-refund',
  transactionType: 'REFUND',
  direction: 'CREDIT',
  amount: '220',
  balanceBefore: '780',
  balanceAfter: '1000',
  pointSource: 'PURCHASED',
  status: 'POSTED',
  displayTitle: 'Ride cancellation refund',
  displayCategory: 'CANCELLATION',
  referenceType: 'BOOKING',
  referenceId: 'booking-uuid',
  rideId: 'ride-uuid',
  rideType: 'COMMUTE',
  createdAt: '2026-09-02T01:07:42.948Z',
});
assertEqual(
  mapWalletTransactionDisplay(commuteRefund!).title,
  'Ride cancellation refund',
  'refund uses backend displayTitle',
);
assertEqual(
  mapWalletTransactionVisual(commuteRefund!).iconTone,
  'credit',
  'CANCELLATION category uses credit tone',
);

// Fallback mapping when displayTitle is absent
const camel = normalizeWalletTransactionDto({
  transactionId: 'tx-1',
  transactionType: 'BOOKING_PAYMENT',
  direction: 'DEBIT',
  amount: '500',
  balanceBefore: '500',
  balanceAfter: '0',
  pointSource: 'PURCHASED',
  status: 'POSTED',
  referenceType: 'BOOKING',
  referenceId: 'booking-uuid',
  rideId: 'ride-uuid',
  rideType: 'ASSURED',
  createdAt: '2026-01-15T10:00:00.000Z',
});
assertEqual(camel?.rideId, 'ride-uuid', 'camel rideId');
assertEqual(camel?.rideType, 'ASSURED', 'camel rideType');
assertEqual(
  resolveWalletTransactionTitle(camel!),
  'Assured ride fare paid',
  'assured booking fallback title',
);
assertTrue(
  Boolean(mapWalletTransactionDisplay(camel!).subtitle?.includes('Assured')),
  'fallback booking keeps ride subtitle',
);

const snake = normalizeWalletTransactionDto({
  id: 'tx-2',
  transaction_type: 'BOOKING_PAYMENT',
  direction: 'DEBIT',
  amount: '500',
  balance_before: '500',
  balance_after: '0',
  point_source: 'PURCHASED',
  status: 'POSTED',
  reference_type: 'BOOKING',
  reference_id: 'booking-uuid',
  ride_id: 'ride-snake',
  ride_type: 'REGULAR',
  created_at: '2026-01-15T10:00:00.000Z',
});
assertEqual(snake?.transactionType, 'BOOKING_PAYMENT', 'snake transactionType');
assertEqual(
  resolveWalletTransactionTitle(snake!),
  'Ride fare paid',
  'regular booking fallback title',
);

const topUp = normalizeWalletTransactionDto({
  transactionId: 'tx-topup',
  transactionType: 'POINT_PURCHASE',
  direction: 'CREDIT',
  amount: '500',
  balanceBefore: '0',
  balanceAfter: '500',
  pointSource: 'PURCHASED',
  status: 'POSTED',
  displayCategory: 'TOP_UP',
  referenceType: 'TOP_UP_ORDER',
  referenceId: 'order-1',
  createdAt: '2026-01-15T10:00:00.000Z',
});
assertEqual(resolveWalletTransactionTitle(topUp!), 'Coins purchased', 'top-up title');
assertEqual(mapTransactionCategoryIcon('TOP_UP', 'POINT_PURCHASE', 'CREDIT'), 'card', 'top-up icon');

const noRide = normalizeWalletTransactionDto({
  transactionId: 'tx-5',
  transactionType: 'BOOKING_PAYMENT',
  direction: 'DEBIT',
  amount: '100',
  balanceBefore: '100',
  balanceAfter: '0',
  pointSource: 'PURCHASED',
  status: 'POSTED',
  referenceType: 'BOOKING',
  referenceId: 'booking-uuid',
  createdAt: '2026-01-15T10:00:00.000Z',
});
assertEqual(
  resolveWalletTransactionTitle(noRide!),
  'Ride fare paid',
  'booking without rideType still maps fare title',
);

const page = normalizeWalletTransactionList([
  {
    transactionId: 'tx-6',
    transactionType: 'BOOKING_PAYMENT',
    direction: 'DEBIT',
    amount: '100',
    balanceBefore: '100',
    balanceAfter: '0',
    pointSource: 'PURCHASED',
    status: 'POSTED',
    displayTitle: 'Office commute booked',
    displayCategory: 'BOOKING',
    referenceType: 'BOOKING',
    referenceId: 'b1',
    rideId: 'r1',
    rideType: 'COMMUTE',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
]);
assertEqual(page.length, 1, 'page list length');
assertEqual(
  mapWalletTransactionDisplay(page[0]!).title,
  'Office commute booked',
  'page list uses displayTitle',
);

if (failed.length > 0) {
  console.error('walletTransaction.utils.test failures:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('walletTransaction.utils.test passed');
