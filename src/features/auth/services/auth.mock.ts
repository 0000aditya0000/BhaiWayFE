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
    gender: payload.gender ?? 'other',
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
          gender: sessionUser.gender ?? null,
          profilePhoto: sessionUser.avatarUri,
        }
      : null,
    profileCompleted: authSession.getProfileCompleted(),
    wallet: {
      balanceCoins: '1000',
      availableCoins: '800',
      heldCoins: '200',
      withdrawableCoins: '100',
      nonWithdrawableCoins: '700',
      buckets: {
        purchased: { availableCoins: '500', heldCoins: '100' },
        promotional: { availableCoins: '200', heldCoins: '50' },
        driverEarned: { availableCoins: '100', heldCoins: '50' },
      },
    },
    driverEarnings: {
      regularTotalCoins: '1500',
      assuredTotalCoins: '800',
      commuteTotalCoins: '400',
      totalCoins: '2700',
    },
    ratings: {
      overall: { averageRating: 4.5, totalRatings: 20 },
      asDriver: { averageRating: 4.8, totalRatings: 12 },
      asRider: { averageRating: 4.1, totalRatings: 8 },
    },
  };
};

export const updateProfile = async (
  payload: CompleteProfilePayload,
): Promise<UserProfile> => {
  await delay(AUTH_MOCK_DELAYS.completeProfileMs);
  const current = authSession.getUser();
  const profile: UserProfile = {
    id: current?.id ?? generateId('user'),
    fullName: payload.fullName,
    email: payload.email,
    gender: payload.gender ?? 'other',
    avatarUri: payload.avatarUri ?? current?.avatarUri ?? null,
  };
  authSession.setUserFromProfile(profile);
  return profile;
};

export const updateProfilePhoto = async (
  profilePhoto: string | null,
): Promise<UserProfile> => {
  await delay(AUTH_MOCK_DELAYS.completeProfileMs);
  const current = authSession.getUser();
  const profile: UserProfile = {
    id: current?.id ?? generateId('user'),
    fullName: current?.fullName ?? 'User',
    email: current?.email ?? '',
    gender: 'other',
    avatarUri: profilePhoto,
  };
  authSession.setUserFromProfile(profile);
  return profile;
};
