import { env } from '@/config';
import { otpService } from '@/shared/services/otp';
import * as authApi from '../api';
import * as usersApi from '../api/users.api';
import type {
  AuthSession,
  CompleteProfilePayload,
  RequestOtpPayload,
  RequestOtpResult,
  UserProfile,
  VerifyOtpPayload,
} from '../types';
import * as authMock from './auth.mock';
import * as authMsg91 from './auth.msg91';
import {
  establishAuthSession,
  hydrateAuthenticatedUserFromServer,
} from './sessionHydration';

type OtpPayloadWithReq = RequestOtpPayload & { verificationId?: string };

/** Widget credentials are optional — live API send/verify is backend-owned MSG91. */
const useMsg91Widget = env.useMsg91Otp && otpService.isConfigured();
const otpImpl = useMsg91Widget ? authMsg91 : env.useMocks ? authMock : authApi;
/** Profile is a BhaiWay API, not MSG91. Never mock it when live auth is active. */
const profileImpl = env.useMocks && !useMsg91Widget ? authMock : authApi;

/** Profile/user APIs use BhaiWay backend when live auth is active. */
const userImpl = env.useMocks && !useMsg91Widget ? authMock : usersApi;

console.log('[Auth OTP] provider', {
  provider: useMsg91Widget ? 'msg91-widget' : env.useMocks ? 'mock-bypass' : 'api',
  useMsg91Otp: env.useMsg91Otp,
  msg91Configured: otpService.isConfigured(),
  useMocks: env.useMocks,
});

export const authService = {
  requestOtp: async (payload: RequestOtpPayload): Promise<RequestOtpResult> => {
    console.log('[Auth OTP] requestOtp entry', {
      provider: useMsg91Widget ? 'msg91-widget' : env.useMocks ? 'mock' : 'api',
      phoneNumber: payload.phoneNumber,
      dialCode: payload.dialCode,
    });
    try {
      const result = await otpImpl.requestOtp(payload);
      console.log('[Auth OTP] requestOtp response', result);
      return result;
    } catch (error) {
      console.log('[Auth OTP] requestOtp error', error);
      throw error;
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<AuthSession> => {
    console.log('[Auth OTP] verifyOtp entry', {
      provider: useMsg91Widget ? 'msg91-widget' : env.useMocks ? 'mock' : 'api',
      phoneNumber: payload.phoneNumber,
      verificationId: payload.verificationId,
      codeLength: payload.code?.length ?? 0,
    });
    try {
      const session = await otpImpl.verifyOtp(payload);
      console.log('[Auth OTP] verifyOtp response', {
        userId: session.userId,
        isNewUser: session.isNewUser,
        tokenPreview: session.token ? `${session.token.slice(0, 12)}…` : null,
      });
      return session;
    } catch (error) {
      console.log('[Auth OTP] verifyOtp error', error);
      throw error;
    }
  },

  resendOtp: async (payload: OtpPayloadWithReq): Promise<RequestOtpResult> => {
    console.log('[Auth OTP] resendOtp entry', {
      provider: useMsg91Widget ? 'msg91-widget' : env.useMocks ? 'mock' : 'api',
      phoneNumber: payload.phoneNumber,
      verificationId: payload.verificationId,
    });
    try {
      const result = useMsg91Widget
        ? await authMsg91.resendOtp(payload)
        : await otpImpl.requestOtp(payload);
      console.log('[Auth OTP] resendOtp response', result);
      return result;
    } catch (error) {
      console.log('[Auth OTP] resendOtp error', error);
      throw error;
    }
  },

  completeProfile: (payload: CompleteProfilePayload): Promise<UserProfile> =>
    profileImpl.completeProfile(payload),

  updateProfile: (payload: CompleteProfilePayload): Promise<UserProfile> =>
    userImpl.updateProfile(payload),

  updateProfilePhoto: (profilePhoto: string | null): Promise<UserProfile> =>
    userImpl.updateProfilePhoto(profilePhoto),

  getMe: () => userImpl.getMe(),

  hydrateAuthenticatedUser: (options?: { force?: boolean }): Promise<boolean> =>
    hydrateAuthenticatedUserFromServer(options),

  establishAuthSession: (
    session: AuthSession,
    phoneFallback: string,
    options?: { hydrateFromSheet?: () => Promise<void> },
  ): Promise<void> => establishAuthSession(session, phoneFallback, options),
};
