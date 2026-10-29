import {
  PAYMENT_METHOD_ERROR_MESSAGES,
  isValidUpiId,
  mapPaymentMethodError,
  validateBankForm,
  validateUpiForm,
} from './paymentMethods.mapper';

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

assertTrue(isValidUpiId('user@upi'), 'valid upi');
assertFalse(isValidUpiId('bad'), 'invalid upi');

const upiOk = validateUpiForm(' User@OkAxis ');
assertTrue(upiOk.ok, 'upi form ok');
if (upiOk.ok) {
  assertEqual(upiOk.upiId, 'user@okaxis', 'upi normalized');
}

const bankBad = validateBankForm({
  accountHolderName: 'A',
  bankName: 'HDFC',
  accountNumber: '1234567890',
  confirmAccountNumber: '999',
  ifscCode: 'HDFC0001234',
});
assertFalse(bankBad.ok, 'account mismatch');

const bankOk = validateBankForm({
  accountHolderName: 'A',
  bankName: 'HDFC',
  accountNumber: '1234567890',
  confirmAccountNumber: '1234567890',
  ifscCode: 'hdfc0001234',
});
assertTrue(bankOk.ok, 'bank form ok');
if (bankOk.ok) {
  assertEqual(bankOk.ifscCode, 'HDFC0001234', 'ifsc uppercased');
}

assertEqual(
  mapPaymentMethodError({ code: 'PAYMENT_METHOD_NOT_FOUND', status: 404 }),
  PAYMENT_METHOD_ERROR_MESSAGES.PAYMENT_METHOD_NOT_FOUND,
  'not found mapped',
);
assertEqual(
  mapPaymentMethodError({ code: 'PAYMENT_METHOD_INACTIVE', status: 400 }),
  PAYMENT_METHOD_ERROR_MESSAGES.PAYMENT_METHOD_INACTIVE,
  'inactive mapped',
);

if (failed.length) {
  throw new Error(`paymentMethods.mapper tests failed:\n${failed.join('\n')}`);
}
console.log('paymentMethods.mapper tests passed');
