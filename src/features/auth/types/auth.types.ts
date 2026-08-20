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
}

/** Body for `POST /auth/msg91/verify` (Swagger: VerifyMsg91Dto). */
export interface VerifyMsg91Payload {
  accessToken: string;
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
  gender: Gender;
  avatarUri?: string | null;
}

/** Swagger: Gender */
export type ApiGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

/** Body for `POST /users/profile` (Swagger: CreateProfileDto). */
export interface CreateProfileRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  gender?: ApiGender;
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

/** Swagger: UserSummaryDto */
export interface UserSummaryResponse {
  id: string;
  phone: string;
  phoneVerified: boolean;
  email?: string | null;
  emailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

/** Swagger: GetMeResponseDto */
export interface GetMeResponse {
  user: UserSummaryResponse;
  profile: ProfileResponse | null;
  profileCompleted: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  gender: Gender;
  avatarUri: string | null;
}
