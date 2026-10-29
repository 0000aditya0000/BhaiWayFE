import {
  convertRupeesToPaise,
  isRazorpayCancellation,
} from '../utils/razorpay.utils';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

// 1. Rupee to paise conversion tests
assertEqual(convertRupeesToPaise('10'), 1000, '10 rupees -> 1000 paise');
assertEqual(convertRupeesToPaise('500'), 50000, '500 rupees -> 50000 paise');
assertEqual(convertRupeesToPaise(100), 10000, '100 numeric -> 10000 paise');
assertEqual(convertRupeesToPaise(' 250 '), 25000, 'trimmed string 250 -> 25000 paise');

try {
  convertRupeesToPaise('-10');
  failed.push('negative amount should throw');
} catch {
  // Expected
}

try {
  convertRupeesToPaise('abc');
  failed.push('invalid amount should throw');
} catch {
  // Expected
}

// 2. Cancellation detection tests
assertEqual(
  isRazorpayCancellation({ code: 0, description: 'Payment Cancelled by user' }),
  true,
  'code 0 with Cancelled description -> true',
);

assertEqual(
  isRazorpayCancellation({ code: 2, description: 'Back pressed' }),
  true,
  'code 2 -> true',
);

assertEqual(
  isRazorpayCancellation({
    code: 1,
    description: 'Bad request',
    error: { reason: 'payment_cancelled' },
  }),
  true,
  'reason payment_cancelled -> true',
);

assertEqual(
  isRazorpayCancellation({
    code: 5,
    description: 'Payment failed due to invalid OTP',
  }),
  false,
  'genuine payment failure -> false',
);

assertEqual(isRazorpayCancellation(null), false, 'null error -> false');

if (failed.length > 0) {
  console.error('paymentGateway.test.ts failures:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('paymentGateway.test.ts passed');
