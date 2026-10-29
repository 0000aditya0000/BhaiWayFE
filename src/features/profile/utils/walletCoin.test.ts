import {
  compareCoinStrings,
  formatCoinString,
  formatSignedCoinString,
  isIntegerCoinString,
  isPositiveCoins,
  parseIntegerCoinString,
  sanitizeCoinInput,
  validateTopUpAmount,
} from './walletCoin';
import {
  extractWalletTransactionRideContext,
  mapTransactionCategoryIcon,
  mapTransactionDirectionType,
  mapTransactionTypeLabel,
  mapWalletTransactionDisplay,
  mapWalletTransactionVisual,
  resolveWalletTransactionTitle,
} from './mapWalletTransaction';

const failed: string[] = [];

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

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

assertTrue(isIntegerCoinString('1000'), 'valid integer string');
assertFalse(isIntegerCoinString('100.5'), 'rejects decimal');
assertTrue(isIntegerCoinString('0'), 'zero is valid integer string');
assertEqual(parseIntegerCoinString('0100'), '100', 'strips leading zeros');
assertEqual(formatCoinString('1000'), '1,000', 'formats with grouping');
assertEqual(formatSignedCoinString('500', 'CREDIT'), '+ 500', 'credit sign');
assertEqual(formatSignedCoinString('200', 'DEBIT'), '- 200', 'debit sign');
assertTrue(isPositiveCoins('1'), 'positive coins');
assertFalse(isPositiveCoins('0'), 'zero not positive');
assertEqual(compareCoinStrings('100', '20'), 1, 'compare larger');
assertEqual(sanitizeCoinInput('₹500abc'), '500', 'sanitize input');

const valid = validateTopUpAmount('250');
assertTrue(valid.ok, 'valid top-up');
if (valid.ok) {
  assertEqual(valid.amount, '250', 'validated amount');
}
const invalid = validateTopUpAmount('0');
assertFalse(invalid.ok, 'invalid zero top-up');

assertEqual(mapTransactionTypeLabel('POINT_PURCHASE'), 'Coins purchased', 'type label');
assertEqual(mapTransactionTypeLabel('UNKNOWN_TYPE_XYZ'), 'Wallet transaction', 'fallback label');
assertEqual(mapTransactionDirectionType('DEBIT'), 'debit', 'direction debit');

const bookingDto = {
  transactionId: 'tx-1',
  transactionType: 'BOOKING_PAYMENT',
  direction: 'DEBIT',
  amount: '500',
  balanceBefore: '500',
  balanceAfter: '0',
  pointSource: 'PURCHASED',
  status: 'POSTED',
  displayTitle: 'Assured ride fare paid',
  displayCategory: 'BOOKING',
  referenceType: 'BOOKING',
  referenceId: 'booking-uuid',
  rideId: 'ride-uuid',
  rideType: 'ASSURED',
  createdAt: '2026-01-15T10:00:00.000Z',
};

const rideDisplay = mapWalletTransactionDisplay(bookingDto);
assertEqual(rideDisplay.title, 'Assured ride fare paid', 'uses displayTitle from API');
assertEqual(rideDisplay.subtitle, undefined, 'no subtitle when displayTitle present');

const fallbackBooking = mapWalletTransactionDisplay({
  ...bookingDto,
  displayTitle: null,
});
assertEqual(
  resolveWalletTransactionTitle({ ...bookingDto, displayTitle: null }),
  'Assured ride fare paid',
  'assured booking fallback title',
);
assertTrue(
  Boolean(fallbackBooking.subtitle?.includes('Assured')),
  'fallback booking subtitle includes type',
);

const commuteDto = {
  ...bookingDto,
  displayTitle: 'Office commute booked',
  rideType: 'COMMUTE',
};
assertEqual(mapWalletTransactionDisplay(commuteDto).title, 'Office commute booked', 'commute title');
assertEqual(
  mapWalletTransactionVisual(commuteDto).icon,
  'car',
  'commute booking icon',
);

const refundDto = {
  ...bookingDto,
  transactionType: 'REFUND',
  direction: 'CREDIT',
  displayTitle: 'Ride cancellation refund',
  displayCategory: 'CANCELLATION',
};
assertEqual(mapWalletTransactionDisplay(refundDto).title, 'Ride cancellation refund', 'refund title');
assertEqual(
  mapWalletTransactionVisual(refundDto).iconTone,
  'credit',
  'cancellation refund tone',
);

assertEqual(
  extractWalletTransactionRideContext({
    ...bookingDto,
    rideId: '',
    referenceType: 'RIDE',
    referenceId: 'ride-from-reference',
    rideType: 'COMMUTE',
  })?.rideTypeLabel,
  'Office Commute',
  'commute ride type label',
);

const topUpDisplay = mapWalletTransactionDisplay({
  ...bookingDto,
  transactionType: 'POINT_PURCHASE',
  displayTitle: null,
  displayCategory: 'TOP_UP',
  referenceType: 'TOP_UP_ORDER',
  referenceId: 'order-1',
  rideId: undefined,
  rideType: undefined,
});
assertEqual(topUpDisplay.title, 'Coins purchased', 'top-up title');
assertEqual(
  mapTransactionCategoryIcon('TOP_UP', 'POINT_PURCHASE', 'CREDIT'),
  'card',
  'top-up category icon',
);

if (failed.length > 0) {
  console.error('walletCoin.test.ts failures:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('walletCoin.test.ts passed');
