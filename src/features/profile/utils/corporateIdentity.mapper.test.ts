import {
  CORPORATE_DOMAIN_POLICY_OWNER,
  CORPORATE_IDENTITY_ERROR_MESSAGES,
  isCorporateOtpPendingStatus,
  isCorporateVerifiedStatus,
  isValidCorporateEmailSyntax,
  isValidCorporateOtp,
  mapCorporateIdentityError,
  normalizeCorporateEmail,
  normalizeCorporateOtp,
} from './corporateIdentity.mapper';

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

assertEqual(CORPORATE_DOMAIN_POLICY_OWNER, 'backend', 'domain policy owned by backend');

assertTrue(isValidCorporateEmailSyntax('employee@company.com'), 'valid corporate syntax');
assertFalse(isValidCorporateEmailSyntax('not-an-email'), 'invalid syntax rejected');
assertEqual(
  normalizeCorporateEmail('  Employee@Company.COM '),
  'employee@company.com',
  'email normalized',
);

assertTrue(isValidCorporateOtp('4827'), '4-digit otp valid');
assertFalse(isValidCorporateOtp('482'), 'otp too short');
assertEqual(normalizeCorporateOtp('48a27x'), '4827', 'otp digits only');

assertTrue(isCorporateVerifiedStatus('VERIFIED'), 'verified status');
assertTrue(isCorporateOtpPendingStatus('OTP_PENDING'), 'otp pending status');
assertFalse(isCorporateVerifiedStatus('NOT_VERIFIED'), 'not verified');

assertEqual(
  mapCorporateIdentityError({ code: 'CORPORATE_EMAIL_NOT_ALLOWED', status: 400 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.CORPORATE_EMAIL_NOT_ALLOWED,
  'CORPORATE_EMAIL_NOT_ALLOWED mapped',
);

assertEqual(
  mapCorporateIdentityError({ code: 'OTP_INVALID', status: 400 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.INVALID_OTP,
  'invalid OTP mapped',
);

assertEqual(
  mapCorporateIdentityError({ code: 'OTP_EXPIRED', status: 400 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.EXPIRED_OTP,
  'expired OTP mapped',
);

assertEqual(
  mapCorporateIdentityError({ code: 'OTP_ATTEMPTS_EXCEEDED', status: 400 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
  'too many attempts mapped',
);

assertEqual(
  mapCorporateIdentityError({ code: 'OTP_COOLDOWN', status: 429 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.COOLDOWN,
  'cooldown mapped',
);

assertEqual(
  mapCorporateIdentityError({ code: 'HTTP_429', status: 429 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.RATE_LIMIT,
  'rate limit mapped',
);

assertEqual(
  mapCorporateIdentityError({ code: 'NETWORK_ERROR', status: 0 }),
  CORPORATE_IDENTITY_ERROR_MESSAGES.NETWORK,
  'network mapped',
);

// No personal/free domain blocklist in mapper source contract.
const mapperSourceKeys = Object.keys(CORPORATE_IDENTITY_ERROR_MESSAGES).join(',');
assertFalse(mapperSourceKeys.toLowerCase().includes('gmail'), 'no gmail in error keys');
assertFalse(
  Object.values(CORPORATE_IDENTITY_ERROR_MESSAGES).some((msg) =>
    /gmail|yahoo|outlook|hotmail|icloud|proton/i.test(msg),
  ),
  'no free-email domain names in user messages',
);

if (failed.length > 0) {
  throw new Error(`corporateIdentity.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('corporateIdentity.mapper tests passed');
