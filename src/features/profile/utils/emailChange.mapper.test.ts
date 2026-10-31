import {
  EMAIL_CHANGE_COOLDOWN_SECONDS,
  EMAIL_CHANGE_ERROR_CODES,
  EMAIL_CHANGE_ERROR_MESSAGES,
  EMAIL_CHANGE_OTP_LENGTH,
  isValidChangeEmailOtp,
  isValidNewEmail,
  mapEmailChangeError,
  maskEmail,
  normalizeChangeEmailOtp,
  normalizeNewEmail,
  parseEmailChangeError,
} from './emailChange.mapper';

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

// Length & Cooldown
assertEqual(EMAIL_CHANGE_OTP_LENGTH, 4, 'OTP length is 4');
assertEqual(EMAIL_CHANGE_COOLDOWN_SECONDS, 60, 'resend cooldown is 60s');

// OTP formatting & validation
assertEqual(normalizeChangeEmailOtp('123abc4'), '1234', 'numeric OTP strips letters');
assertEqual(normalizeChangeEmailOtp('123456789'), '1234', 'caps at 4 digits');
assertTrue(isValidChangeEmailOtp('1234'), 'valid 4 digit otp');
assertFalse(isValidChangeEmailOtp('123'), 'too short');
assertFalse(isValidChangeEmailOtp('12345'), 'too long');
assertFalse(isValidChangeEmailOtp('123a'), 'alphanumeric rejected');

// Email normalization & validation
assertEqual(normalizeNewEmail('  Test.Driver@Example.COM  '), 'test.driver@example.com', 'normalizes email');
assertTrue(isValidNewEmail('user@domain.com'), 'valid standard email');
assertTrue(isValidNewEmail('first.last+tag@sub.example.co.in'), 'valid email with subdomains and tags');
assertFalse(isValidNewEmail('invalid-email'), 'missing @ and domain');
assertFalse(isValidNewEmail('user@'), 'missing domain');
assertFalse(isValidNewEmail('@domain.com'), 'missing local part');
assertFalse(isValidNewEmail(''), 'empty email is invalid');

// Masking
assertEqual(maskEmail('new.driver@example.com'), 'n***r@example.com', 'masks regular email');
assertEqual(maskEmail('john@example.com'), 'j**n@example.com', 'masks 4-char local part');
assertEqual(maskEmail('ab@example.com'), 'a*@example.com', 'masks 2-char local part');
assertEqual(maskEmail('a@example.com'), 'a***@example.com', 'masks 1-char local part');

// Error mapping
assertEqual(
  mapEmailChangeError({ code: 'EMAIL_SAME_AS_CURRENT' }),
  EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_SAME_AS_CURRENT,
  'maps EMAIL_SAME_AS_CURRENT',
);

assertEqual(
  mapEmailChangeError({ code: 'EMAIL_ALREADY_REGISTERED' }),
  EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
  'maps EMAIL_ALREADY_REGISTERED',
);

assertEqual(
  mapEmailChangeError({ code: 'EMAIL_OTP_RATE_LIMITED' }),
  EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_RATE_LIMITED,
  'maps EMAIL_OTP_RATE_LIMITED',
);

assertEqual(
  mapEmailChangeError({ code: 'NO_PENDING_EMAIL_CHANGE' }),
  EMAIL_CHANGE_ERROR_MESSAGES.NO_PENDING_EMAIL_CHANGE,
  'maps NO_PENDING_EMAIL_CHANGE',
);

assertEqual(
  mapEmailChangeError({ code: 'PENDING_EMAIL_MISMATCH' }),
  EMAIL_CHANGE_ERROR_MESSAGES.PENDING_EMAIL_MISMATCH,
  'maps PENDING_EMAIL_MISMATCH',
);

assertEqual(
  mapEmailChangeError({ code: 'EMAIL_OTP_EXPIRED' }),
  EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_EXPIRED,
  'maps EMAIL_OTP_EXPIRED',
);

assertEqual(
  mapEmailChangeError({ code: 'EMAIL_OTP_ATTEMPTS_EXCEEDED' }),
  EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_ATTEMPTS_EXCEEDED,
  'maps EMAIL_OTP_ATTEMPTS_EXCEEDED',
);

// Cooldown details parsing
const cooldownParsed = parseEmailChangeError({
  code: 'EMAIL_OTP_COOLDOWN',
  details: { cooldownSeconds: 42 },
});
assertEqual(cooldownParsed.code, EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_COOLDOWN, 'cooldown code match');
assertEqual(cooldownParsed.cooldownSeconds, 42, 'extracts cooldownSeconds');
assertEqual(cooldownParsed.message, 'Please wait 42s before requesting another code.', 'formats cooldown message');

// Invalid OTP with remaining attempts
const invalidOtpParsed = parseEmailChangeError({
  code: 'EMAIL_OTP_INVALID',
  details: { remainingAttempts: 2 },
});
assertEqual(invalidOtpParsed.code, EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_INVALID, 'invalid code match');
assertEqual(invalidOtpParsed.remainingAttempts, 2, 'extracts remaining attempts');
assertEqual(
  invalidOtpParsed.message,
  'Incorrect verification code. 2 attempts remaining.',
  'formats remaining attempts message',
);

// Session mismatch flag
const mismatchParsed = parseEmailChangeError({ code: 'PENDING_EMAIL_MISMATCH' });
assertTrue(mismatchParsed.sessionMismatch, 'flags session mismatch');

// Rate limited flag
const rateLimitedParsed = parseEmailChangeError({ code: 'EMAIL_OTP_RATE_LIMITED' });
assertTrue(rateLimitedParsed.rateLimited, 'flags rate limited');

// Attempts exceeded flag
const exceededParsed = parseEmailChangeError({ code: 'EMAIL_OTP_ATTEMPTS_EXCEEDED' });
assertTrue(exceededParsed.attemptsExceeded, 'flags attempts exceeded');

if (failed.length > 0) {
  console.error(`Email change mapper tests failed (${failed.length}):\n${failed.join('\n')}`);
  process.exit(1);
} else {
  console.log('All email change mapper tests passed successfully!');
}
