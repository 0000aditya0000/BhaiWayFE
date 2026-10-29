import {
  WITHDRAWAL_ERROR_MESSAGES,
  WITHDRAWAL_STATUS_COPY,
  asWithdrawalStatus,
  generateWithdrawIdempotencyKey,
  mapWithdrawalError,
  validateWithdrawAmount,
} from './withdrawals.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected truthy, got ${String(actual)}`);
  }
};

const assertFalse = (actual: unknown, label: string): void => {
  if (actual) {
    failed.push(`${label}: expected falsy, got ${String(actual)}`);
  }
};

assertEqual(asWithdrawalStatus('PROCESSING'), 'PROCESSING', 'status parse');
assertEqual(WITHDRAWAL_STATUS_COPY.INITIATED.label, 'Initiated', 'initiated copy');
assertEqual(WITHDRAWAL_STATUS_COPY.FAILED.description, 'Withdrawal failed', 'failed copy');
assertEqual(WITHDRAWAL_STATUS_COPY.CANCELLED.description, 'Withdrawal cancelled', 'cancelled copy');

const ok = validateWithdrawAmount('2000', '2500');
assertTrue(ok.ok, 'amount within available');

const over = validateWithdrawAmount('3000', '2500');
assertFalse(over.ok, 'amount exceeds available');
if (!over.ok) {
  assertEqual(
    over.message,
    WITHDRAWAL_ERROR_MESSAGES.INSUFFICIENT_WITHDRAWABLE_BALANCE,
    'insufficient message',
  );
}

const key1 = generateWithdrawIdempotencyKey();
const key2 = generateWithdrawIdempotencyKey();
assertTrue(key1.startsWith('withdraw-'), 'idempotency prefix');
assertTrue(key1 !== key2, 'new key each call');

assertEqual(
  mapWithdrawalError({ code: 'INSUFFICIENT_WITHDRAWABLE_BALANCE', status: 400 }),
  WITHDRAWAL_ERROR_MESSAGES.INSUFFICIENT_WITHDRAWABLE_BALANCE,
  'insufficient mapped',
);
assertEqual(
  mapWithdrawalError({ code: 'TIMEOUT', status: 0 }),
  WITHDRAWAL_ERROR_MESSAGES.TIMEOUT,
  'timeout mapped',
);

if (failed.length) {
  throw new Error(`withdrawals.mapper tests failed:\n${failed.join('\n')}`);
}
console.log('withdrawals.mapper tests passed');
