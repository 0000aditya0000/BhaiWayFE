/**
 * Auth OTP adapter backed by MSG91 SendOTP (custom UI / OTPWidget),
 * then exchanges the MSG91 access token for a BhaiWay JWT via
 * `POST /auth/msg91/verify`.
 *
 * Temporary Play Store review path: when the entered phone matches
 * `PLAY_REVIEW_PHONE`, send/verify go through BhaiWay `/auth/msg91/send`
 * and `/auth/msg91/verify` with `{ phone, otp }` — same OTP UI, no special chrome.
 */

import {
  buildMsg91Identifier,
  otpService,
} from '@/shared/services/otp';
import {
  mapAuthLoginToSession,
  sendMsg91Otp,
  verifyMsg91AccessToken,
} from '../api';
import type {
  AuthSession,
  RequestOtpPayload,
  RequestOtpResult,
  VerifyOtpPayload,
} from '../types';
import {
  buildMsg91VerifyPayload,
  isPlayReviewPhone,
  normalizeAuthPhoneDigits,
} from '../utils/playReviewLogin';

const OTP_EXPIRES_SECONDS = 300;

/** Opaque req id so the existing OTP screen opens without MSG91 widget state. */
const playReviewVerificationId = (phoneNumber: string): string =>
  `play-review:${normalizeAuthPhoneDigits(phoneNumber)}`;

const isPlayReviewVerificationId = (verificationId: string): boolean =>
  verificationId.startsWith('play-review:');

const exchangeMsg91PayloadForBhaiWaySession = async (
  payload: Parameters<typeof verifyMsg91AccessToken>[0],
): Promise<AuthSession> => {
  const authResponse = await verifyMsg91AccessToken(payload);
  const session = mapAuthLoginToSession(authResponse);
  console.log('[MSG91 Auth] BhaiWay session', {
    userId: session.userId,
    phone: session.phone,
    profileCompleted: session.profileCompleted,
    isNewUser: session.isNewUser,
    tokenPreview: session.token ? `${session.token.slice(0, 16)}…` : null,
  });
  return session;
};

const requestPlayReviewOtp = async (
  payload: RequestOtpPayload,
): Promise<RequestOtpResult> => {
  const phone = normalizeAuthPhoneDigits(payload.phoneNumber);
  console.log('[MSG91 Auth] requestOtp play-review path', { phone });
  await sendMsg91Otp({ phone });
  return {
    verificationId: playReviewVerificationId(phone),
    expiresInSeconds: OTP_EXPIRES_SECONDS,
  };
};

export const requestOtp = async (payload: RequestOtpPayload): Promise<RequestOtpResult> => {
  if (isPlayReviewPhone(payload.phoneNumber)) {
    return requestPlayReviewOtp(payload);
  }

  const identifier = buildMsg91Identifier(payload.phoneNumber, payload.dialCode);
  console.log('[MSG91 Auth] requestOtp', { identifier, dialCode: payload.dialCode });

  const result = await otpService.sendOtp(identifier);
  console.log('[MSG91 Auth] requestOtp MSG91 result', {
    reqId: result.reqId,
    alreadyVerified: result.alreadyVerified,
    hasAccessToken: Boolean(result.accessToken),
  });

  // Invisible / already-verified: still return a verificationId so the OTP screen can proceed.
  if (result.alreadyVerified && result.accessToken) {
    const mapped = {
      verificationId: `verified:${result.accessToken}`,
      expiresInSeconds: OTP_EXPIRES_SECONDS,
    };
    console.log('[MSG91 Auth] requestOtp mapped (already verified)', {
      verificationIdPreview: 'verified:…',
      expiresInSeconds: mapped.expiresInSeconds,
    });
    return mapped;
  }

  const mapped = {
    verificationId: result.reqId,
    expiresInSeconds: OTP_EXPIRES_SECONDS,
  };
  console.log('[MSG91 Auth] requestOtp mapped', mapped);
  return mapped;
};

export const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthSession> => {
  console.log('[MSG91 Auth] verifyOtp', {
    phoneNumber: payload.phoneNumber,
    verificationId: payload.verificationId.startsWith('verified:')
      ? 'verified:…'
      : isPlayReviewVerificationId(payload.verificationId)
        ? 'play-review:…'
        : payload.verificationId,
    codeLength: payload.code?.length ?? 0,
  });

  // Temporary Play Store review: same OTP UI → phone+otp verify payload.
  if (
    isPlayReviewPhone(payload.phoneNumber) ||
    isPlayReviewVerificationId(payload.verificationId)
  ) {
    const verifyPayload = buildMsg91VerifyPayload({
      phoneNumber: payload.phoneNumber,
      otp: payload.code,
      referralCode: payload.referralCode,
    });
    return exchangeMsg91PayloadForBhaiWaySession(verifyPayload);
  }

  let msg91AccessToken: string;

  if (payload.verificationId.startsWith('verified:')) {
    msg91AccessToken = payload.verificationId.slice('verified:'.length);
    console.log('[MSG91 Auth] using pre-verified MSG91 access token');
  } else {
    const verified = await otpService.verifyOtp(payload.verificationId, payload.code);
    msg91AccessToken = verified.accessToken;
    console.log('[MSG91 Auth] MSG91 OTP verified', {
      reqId: verified.reqId,
      accessTokenPreview: `${msg91AccessToken.slice(0, 24)}…`,
    });
  }

  // Docs: MSG91 access token → POST /auth/msg91/verify → BhaiWay JWT
  const verifyPayload = buildMsg91VerifyPayload({
    phoneNumber: payload.phoneNumber,
    accessToken: msg91AccessToken,
    referralCode: payload.referralCode,
  });
  return exchangeMsg91PayloadForBhaiWaySession(verifyPayload);
};

export const resendOtp = async (
  payload: RequestOtpPayload & { verificationId?: string },
): Promise<RequestOtpResult> => {
  console.log('[MSG91 Auth] resendOtp', {
    phoneNumber: payload.phoneNumber,
    verificationId: payload.verificationId
      ? isPlayReviewVerificationId(payload.verificationId)
        ? 'play-review:…'
        : payload.verificationId.startsWith('verified:')
          ? 'verified:…'
          : payload.verificationId
      : undefined,
  });

  if (isPlayReviewPhone(payload.phoneNumber)) {
    return requestPlayReviewOtp(payload);
  }

  if (payload.verificationId && !payload.verificationId.startsWith('verified:')) {
    try {
      await otpService.retryOtp(payload.verificationId, 'SMS');
      const mapped = {
        verificationId: payload.verificationId,
        expiresInSeconds: OTP_EXPIRES_SECONDS,
      };
      console.log('[MSG91 Auth] resendOtp retry ok', mapped);
      return mapped;
    } catch (error) {
      console.log('[MSG91 Auth] resendOtp retry failed, sending fresh OTP', error);
    }
  }
  return requestOtp(payload);
};
