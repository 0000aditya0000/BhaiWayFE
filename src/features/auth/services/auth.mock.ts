import type { ApiError } from '@/network';
import { delay, generateId } from '@/shared/utils';
import { authSession } from '@/store';
import { AUTH_MOCK_DELAYS, INVALID_MOCK_OTP } from '../constants';
import type {
  AuthSession,
  CompleteProfilePayload,
  GetMeResponse,
  RequestOtpPayload,
  RequestOtpResult,
  UserProfile,
  VerifyOtpPayload,
} from '../types';
import { splitFullName } from '../utils';

export const requestOtp = async (_payload: RequestOtpPayload): Promise<RequestOtpResult> => {
  await delay(AUTH_MOCK_DELAYS.requestOtpMs);
  return {
    verificationId: generateId('otp'),
    expiresInSeconds: 300,
  };
};

export const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthSession> => {
  await delay(AUTH_MOCK_DELAYS.verifyOtpMs);

  if (payload.code === INVALID_MOCK_OTP) {
    const error: ApiError = {
      status: 400,
      code: 'INVALID_OTP',
      message: 'Invalid code. Please try again.',
    };
    throw error;
  }

  return {
    userId: generateId('user'),
    token: generateId('token'),
    isNewUser: true,
  };
};

export const completeProfile = async (
  payload: CompleteProfilePayload,
): Promise<UserProfile> => {
  await delay(AUTH_MOCK_DELAYS.completeProfileMs);
  return {
    id: generateId('user'),
    fullName: payload.fullName,
    email: payload.email,
    gender: payload.gender,
    avatarUri: payload.avatarUri ?? null,
  };
};

export const getMe = async (): Promise<GetMeResponse> => {
  await delay(AUTH_MOCK_DELAYS.completeProfileMs);
  const sessionUser = authSession.getUser();
  const { firstName, lastName } = splitFullName(sessionUser?.fullName ?? '');

  return {
    user: {
      id: sessionUser?.id ?? generateId('user'),
      phone: sessionUser?.phone ?? '',
      phoneVerified: true,
      email: sessionUser?.email ?? null,
      emailVerified: false,
      status: 'ACTIVE',
    },
    profile: sessionUser?.fullName
      ? {
          id: generateId('profile'),
          firstName,
          lastName: lastName ?? null,
          profilePhoto: sessionUser.avatarUri,
        }
      : null,
    profileCompleted: authSession.getProfileCompleted(),
  };
};
