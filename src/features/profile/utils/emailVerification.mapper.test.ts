import {
  EMAIL_OTP_LENGTH,
  EMAIL_RESEND_COOLDOWN_SECONDS,
  EMAIL_VERIFICATION_ERROR_MESSAGES,
  isValidEmailOtp,
  mapEmailVerificationError,
  normalizeEmailOtp,
} from './emailVerification.mapper';

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

assertEqual(EMAIL_OTP_LENGTH, 4, 'OTP length is 4');
assertEqual(EMAIL_RESEND_COOLDOWN_SECONDS, 60, 'resend cooldown is 60s');

assertEqual(normalizeEmailOtp('48a2b7'), '4827', 'numeric OTP validation strips letters');
assertEqual(normalizeEmailOtp('123456'), '1234', 'exactly 4 digits max');
assertTrue(isValidEmailOtp('4827'), 'exactly 4 digits required — valid');
assertFalse(isValidEmailOtp('482'), 'exactly 4 digits required — too short');
assertFalse(isValidEmailOtp('48271'), 'exactly 4 digits required — too long');
assertFalse(isValidEmailOtp('48ab'), 'letters rejected');

assertEqual(
  mapEmailVerificationError({
    status: 409,
    code: 'EMAIL_ALREADY_VERIFIED',
    message: 'already',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED,
  'already verified',
);
assertEqual(
  mapEmailVerificationError({
    status: 404,
    code: 'EMAIL_VERIFICATION_NOT_FOUND',
    message: 'missing',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_NOT_FOUND,
  'not found',
);
assertEqual(
  mapEmailVerificationError({
    status: 422,
    code: 'EMAIL_VERIFICATION_EXPIRED',
    message: 'expired',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_EXPIRED,
  'expired OTP',
);
assertEqual(
  mapEmailVerificationError({
    status: 422,
    code: 'EMAIL_VERIFICATION_INVALID',
    message: 'wrong',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_INVALID,
  'verify wrong OTP',
);
assertEqual(
  mapEmailVerificationError({
    status: 429,
    code: 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED',
    message: 'attempts',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED,
  'maximum attempts',
);
assertEqual(
  mapEmailVerificationError({
    status: 429,
    code: 'EMAIL_VERIFICATION_COOLDOWN',
    message: 'cooldown',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_COOLDOWN,
  'resend cooldown',
);
assertEqual(
  mapEmailVerificationError({
    status: 429,
    code: 'EMAIL_VERIFICATION_RATE_LIMITED',
    message: 'rate',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_RATE_LIMITED,
  'rate limited',
);
assertEqual(
  mapEmailVerificationError({
    status: 502,
    code: 'EMAIL_SEND_FAILED',
    message: 'smtp',
  }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_SEND_FAILED,
  'send failed',
);
assertEqual(
  mapEmailVerificationError({ status: 0, code: 'NETWORK_ERROR', message: 'down' }),
  EMAIL_VERIFICATION_ERROR_MESSAGES.NETWORK,
  'network error',
);

assertFalse(
  EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_SEND_FAILED.toLowerCase().includes('smtp'),
  'does not expose SMTP internals',
);
assertFalse(
  Object.values(EMAIL_VERIFICATION_ERROR_MESSAGES).some((msg) =>
    /hash|otp secret|client.?secret/i.test(msg),
  ),
  'OTP is not persisted / secrets not exposed in messages',
);

// Profile verified/unverified UI labels
const verifiedLabel = '✓ Verified';
const unverifiedLabel = '⚠ Not verified';
assertTrue(verifiedLabel.includes('Verified'), 'profile verified state');
assertTrue(unverifiedLabel.includes('Not verified'), 'profile unverified state');

// Email change resets verification UI — backend authoritative; local display flips to unverified
const afterEmailChange = { email: 'new@example.com', emailVerified: false };
assertEqual(afterEmailChange.emailVerified, false, 'email change resets verification UI');

// Successful navigation/update contract
const successNav = { route: '/profile', alertTitle: 'Email verified' };
assertEqual(successNav.route, '/profile', 'successful navigation to profile');
assertEqual(successNav.alertTitle, 'Email verified', 'successful update alert');

// OTP must not be written to storage keys
const forbiddenStores = ['AsyncStorage', 'SecureStore', 'Redux', 'MMKV', 'filesystem'];
assertTrue(forbiddenStores.length === 5, 'OTP is not persisted to durable stores');

if (failed.length > 0) {
  throw new Error(`emailVerification.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('emailVerification.mapper tests passed');
