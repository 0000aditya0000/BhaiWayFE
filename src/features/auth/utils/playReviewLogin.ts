import { PLAY_REVIEW_PHONE } from '../constants/playReviewLogin.constants';
import type { VerifyMsg91Payload } from '../types';

/**
 * Normalize phone digits the same way login compares 10-digit India mobiles.
 * Strips non-digits; if longer than 10 (e.g. country code prefix), keep last 10.
 */
export const normalizeAuthPhoneDigits = (phone: string): string => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

const NORMALIZED_PLAY_REVIEW_PHONE = normalizeAuthPhoneDigits(PLAY_REVIEW_PHONE);

/** True when the entered login phone is the temporary Play Store review number. */
export const isPlayReviewPhone = (phone: string): boolean =>
  normalizeAuthPhoneDigits(phone) === NORMALIZED_PLAY_REVIEW_PHONE;

export interface BuildMsg91VerifyPayloadInput {
  phoneNumber: string;
  /** OTP digits entered on the existing OTP screen (never logged / persisted here). */
  otp?: string;
  /** MSG91 widget access token for normal users. */
  accessToken?: string;
  /**
   * Optional referral code for NEW users.
   * Caller should pass already-normalized (trim + uppercase) values, or omit.
   */
  referralCode?: string;
  /** Optional email submitted during registration. */
  email?: string;
  /** Mode: "register" when on signup flow. */
  mode?: string;
  /** Flag for registration intent. */
  isRegistration?: boolean;
}

/**
 * Selects `/auth/msg91/verify` (or `/auth/msg91/register`) body from the entered phone.
 * Review phone → `{ phone, otp }`; everyone else → `{ accessToken }`.
 * Adds `referralCode` only when a non-empty value is provided (never sends "").
 */
export const buildMsg91VerifyPayload = (
  input: BuildMsg91VerifyPayloadInput,
): VerifyMsg91Payload => {
  const referralCode = String(input.referralCode ?? '').trim().toUpperCase();
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : undefined;
  const isRegistration = Boolean(input.isRegistration || input.mode?.toLowerCase() === 'register');
  const mode = input.mode ?? (isRegistration ? 'register' : undefined);

  const extraFields = {
    ...(referralCode ? { referralCode } : {}),
    ...(email ? { email } : {}),
    ...(isRegistration ? { isRegistration: true, mode: mode ?? 'register' } : {}),
  };

  if (isPlayReviewPhone(input.phoneNumber)) {
    return {
      phone: normalizeAuthPhoneDigits(input.phoneNumber),
      otp: String(input.otp ?? ''),
      ...extraFields,
    };
  }

  return {
    accessToken: String(input.accessToken ?? ''),
    ...extraFields,
  };
};
