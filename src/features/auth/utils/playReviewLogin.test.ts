import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLAY_REVIEW_PHONE } from '../constants/playReviewLogin.constants';
import {
  buildMsg91VerifyPayload,
  isPlayReviewPhone,
  normalizeAuthPhoneDigits,
} from './playReviewLogin';

const here = dirname(fileURLToPath(import.meta.url));
const authRoot = join(here, '..');

const readAuthSource = (relativePath: string): string =>
  readFileSync(join(authRoot, relativePath), 'utf8');

// ─── TEST 1: review phone + entered OTP → phone/otp payload ───────────────
{
  const enteredOtp = '1234';
  const payload = buildMsg91VerifyPayload({
    phoneNumber: PLAY_REVIEW_PHONE,
    otp: enteredOtp,
  });
  assert.deepEqual(payload, {
    phone: '9761454075',
    otp: enteredOtp,
  });
  assert.equal('accessToken' in payload, false);
}

// ─── TEST 2: normal phone → accessToken payload ───────────────────────────
{
  const payload = buildMsg91VerifyPayload({
    phoneNumber: '9876543210',
    accessToken: 'MSG91_WIDGET_ACCESS_TOKEN',
  });
  assert.deepEqual(payload, {
    accessToken: 'MSG91_WIDGET_ACCESS_TOKEN',
  });
  assert.equal('phone' in payload, false);
  assert.equal('otp' in payload, false);
  assert.equal('referralCode' in payload, false);
}

// ─── TEST 2b: referral code included when provided; omitted when empty ────
{
  const withCode = buildMsg91VerifyPayload({
    phoneNumber: '9876543210',
    accessToken: 'MSG91_WIDGET_ACCESS_TOKEN',
    referralCode: '  bhw7k4p9  ',
  });
  assert.deepEqual(withCode, {
    accessToken: 'MSG91_WIDGET_ACCESS_TOKEN',
    referralCode: 'BHW7K4P9',
  });

  const withoutCode = buildMsg91VerifyPayload({
    phoneNumber: '9876543210',
    accessToken: 'MSG91_WIDGET_ACCESS_TOKEN',
    referralCode: '   ',
  });
  assert.deepEqual(withoutCode, {
    accessToken: 'MSG91_WIDGET_ACCESS_TOKEN',
  });
  assert.equal('referralCode' in withoutCode, false);

  const reviewWithCode = buildMsg91VerifyPayload({
    phoneNumber: PLAY_REVIEW_PHONE,
    otp: '1234',
    referralCode: 'BHW7K4P9',
  });
  assert.deepEqual(reviewWithCode, {
    phone: '9761454075',
    otp: '1234',
    referralCode: 'BHW7K4P9',
  });
}

// ─── TEST 3: review phone with wrong entered OTP — still forwards entered value
{
  const enteredOtp = '9999';
  const payload = buildMsg91VerifyPayload({
    phoneNumber: PLAY_REVIEW_PHONE,
    otp: enteredOtp,
  });
  assert.deepEqual(payload, {
    phone: '9761454075',
    otp: enteredOtp,
  });
}

// ─── TEST 4: phone normalization ──────────────────────────────────────────
{
  assert.equal(normalizeAuthPhoneDigits('9761454075'), '9761454075');
  assert.equal(normalizeAuthPhoneDigits('+91 97614 54075'), '9761454075');
  assert.equal(normalizeAuthPhoneDigits('919761454075'), '9761454075');
  assert.equal(isPlayReviewPhone('9761454075'), true);
  assert.equal(isPlayReviewPhone('+91-9761454075'), true);
  assert.equal(isPlayReviewPhone('9876543210'), false);
  assert.equal(isPlayReviewPhone('9761454076'), false);
}

// ─── TEST 5: normal MSG91 path wiring still present ───────────────────────
{
  const msg91Source = readAuthSource('services/auth.msg91.ts');
  assert.match(msg91Source, /otpService\.sendOtp/);
  assert.match(msg91Source, /otpService\.verifyOtp/);
  assert.match(msg91Source, /buildMsg91VerifyPayload/);
  assert.match(msg91Source, /isPlayReviewPhone/);
  assert.doesNotMatch(msg91Source, /Review Login|Demo Login|Google reviewer|review account/i);
}

// ─── TEST 6: OTP is never persisted / logged as a value ───────────────────
{
  const msg91Source = readAuthSource('services/auth.msg91.ts');
  const utilSource = readAuthSource('utils/playReviewLogin.ts');
  const constSource = readAuthSource('constants/playReviewLogin.constants.ts');

  // Must not log the entered OTP / code value (codeLength is fine).
  assert.doesNotMatch(msg91Source, /console\.log\([^)]*\botp\s*:/i);
  assert.doesNotMatch(msg91Source, /console\.log\([^)]*\bcode\s*:/i);
  assert.doesNotMatch(utilSource, /AsyncStorage|SecureStore|localStorage/);
  // Production review config must not embed a fixed OTP assignment/value.
  assert.doesNotMatch(constSource, /PLAY_REVIEW_OTP|otp\s*=\s*['"]/i);
  assert.doesNotMatch(constSource, /1234/);
  assert.doesNotMatch(utilSource, /1234/);
  assert.doesNotMatch(msg91Source, /1234/);
}

// ─── TEST 7: no special review UI in auth screens / hooks ─────────────────
{
  const uiFiles = [
    'hooks/usePhoneAuth.ts',
    'hooks/useOtpVerification.ts',
    '../../screens/auth/LoginScreen/LoginScreen.tsx',
    '../../screens/auth/OTPVerificationScreen/OTPVerificationScreen.tsx',
    '../../screens/auth/PhoneScreen/PhoneScreen.tsx',
  ];
  for (const relative of uiFiles) {
    const source = readFileSync(join(authRoot, relative), 'utf8');
    assert.doesNotMatch(
      source,
      /PLAY_REVIEW|play-review|Review Login|Demo Login|Google reviewer|review account|prefill|1234/i,
      `${relative} must not expose review UI / OTP`,
    );
  }
}

// Removal point is documented next to the isolated constant.
{
  const constSource = readAuthSource('constants/playReviewLogin.constants.ts');
  assert.match(
    constSource,
    /TODO: Remove Play Store review phone payload routing after Play Store/,
  );
  assert.equal(PLAY_REVIEW_PHONE, '9761454075');
}

console.log('playReviewLogin.test.ts — all assertions passed');
