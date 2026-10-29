export type Gender = 'male' | 'female' | 'other';

export type AuthFlow = 'signup' | 'login';

export interface RequestOtpPayload {
  phoneNumber: string;
  dialCode: string;
}

export interface RequestOtpResult {
  verificationId: string;
  expiresInSeconds: number;
}

export interface VerifyOtpPayload {
  verificationId: string;
  code: string;
  phoneNumber: string;
  /** Optional referral code for NEW users — omitted when empty. */
  referralCode?: string;
}

/**
 * Body for `POST /auth/msg91/verify`.
 * - Normal MSG91 users: `{ accessToken }`
 * - Temporary Play Store review phone: `{ phone, otp }` (backend-validated)
 * - Optional `referralCode` for NEW users only (backend ignores for existing accounts).
 */
export type VerifyMsg91Payload =
  | { accessToken: string; phone?: never; otp?: never; referralCode?: string }
  | { phone: string; otp: string; accessToken?: never; referralCode?: string };

/** Body for `POST /auth/msg91/send` (review-phone acknowledge / normal send bridge). */
export interface Msg91SendPayload {
  phone: string;
}

/** User block from `AuthLoginResponseDto`. */
export interface AuthUserResponse {
  id: string;
  phone: string;
  phoneVerified: boolean;
  profileCompleted: boolean;
}

/** Response from `POST /auth/msg91/verify` (Swagger: AuthLoginResponseDto). */
export interface AuthLoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export interface AuthSession {
  userId: string;
  token: string;
  /** True when profile is not completed on BhaiWay backend. */
  isNewUser: boolean;
  phone?: string;
  profileCompleted?: boolean;
}

export interface CompleteProfilePayload {
  fullName: string;
  email: string;
  /** Optional — gender is set by backend Aadhaar/identity verification. */
  gender?: Gender;
  avatarUri?: string | null;
}

/** Swagger: Gender */
export type ApiGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

/** Body for `POST /users/profile` (Swagger: CreateProfileDto). */
export interface CreateProfileRequest {
  firstName: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  gender?: ApiGender;
  dateOfBirth?: string;
  profilePhoto?: string;
}

/** Body for `PATCH /users/profile` — partial profile update (no email). */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string | null;
  displayName?: string | null;
  gender?: ApiGender;
  dateOfBirth?: string | null;
  profilePhoto?: string | null;
}

/** Response from `POST /users/profile` (Swagger: ProfileResponseDto). */
export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName?: string | null;
  displayName?: string | null;
  gender?: ApiGender | null;
  dateOfBirth?: string | null;
  profilePhoto?: string | null;
}

import type { WalletBalanceDto } from '@/features/profile/api/wallet.types';

/** Swagger: UserSummaryDto */
export interface UserSummaryResponse {
  id: string;
  phone: string;
  phoneVerified: boolean;
  email?: string | null;
  emailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export interface AssuredDepositPenaltyDto {
  percentage: number;
  reason: string;
}

export interface RatingAggregateDto {
  averageRating: number;
  totalRatings: number;
}

export interface UserRatingsBlockDto {
  overall: RatingAggregateDto;
  asDriver: RatingAggregateDto;
  asRider: RatingAggregateDto;
}

export interface DriverEarningsDto {
  regularTotalCoins: string;
  assuredTotalCoins: string;
  commuteTotalCoins: string;
  totalCoins: string;
}

/** Swagger: GetMeResponseDto */
export interface GetMeResponse {
  user: UserSummaryResponse;
  profile: ProfileResponse | null;
  profileCompleted: boolean;
  /** Elevated Assured deposit after a prior Assured cancellation — backend managed. */
  assuredDepositPenalty?: AssuredDepositPenaltyDto | null;
  wallet?: WalletBalanceDto;
  driverEarnings?: DriverEarningsDto;
  ratings?: UserRatingsBlockDto;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  gender: Gender;
  avatarUri: string | null;
}
