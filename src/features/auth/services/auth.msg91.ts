/**
 * Auth OTP adapter backed by MSG91 SendOTP (custom UI / OTPWidget),
 * then exchanges the MSG91 access token for a BhaiWay JWT via
 * `POST /auth/msg91/verify`.
 */

import {
  buildMsg91Identifier,
  otpService,
} from '@/shared/services/otp';
import { mapAuthLoginToSession, verifyMsg91AccessToken } from '../api';
import type {
  AuthSession,
  RequestOtpPayload,
  RequestOtpResult,
  VerifyOtpPayload,
} from '../types';

const OTP_EXPIRES_SECONDS = 300;

const exchangeMsg91TokenForBhaiWaySession = async (
  msg91AccessToken: string,
): Promise<AuthSession> => {
  const authResponse = await verifyMsg91AccessToken({ accessToken: msg91AccessToken });
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

export const requestOtp = async (payload: RequestOtpPayload): Promise<RequestOtpResult> => {
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
      : payload.verificationId,
    codeLength: payload.code?.length ?? 0,
  });

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
  return exchangeMsg91TokenForBhaiWaySession(msg91AccessToken);
};

export const resendOtp = async (
  payload: RequestOtpPayload & { verificationId?: string },
): Promise<RequestOtpResult> => {
  console.log('[MSG91 Auth] resendOtp', {
    phoneNumber: payload.phoneNumber,
    verificationId: payload.verificationId,
  });

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
