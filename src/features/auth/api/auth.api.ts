import { ENDPOINTS, httpClient } from '@/network';
import { authSession } from '@/store';
import type {
  AuthLoginResponse,
  CompleteProfilePayload,
  RequestOtpPayload,
  RequestOtpResult,
  UserProfile,
  VerifyMsg91Payload,
  VerifyOtpPayload,
  AuthSession,
  ProfileResponse,
} from '../types';
import { mapProfileResponseToUserProfile, toCreateProfileRequest } from '../utils';

export const requestOtp = (payload: RequestOtpPayload): Promise<RequestOtpResult> =>
  httpClient.post<RequestOtpResult>(ENDPOINTS.auth.requestOtp, payload);

export const verifyOtp = (payload: VerifyOtpPayload): Promise<AuthSession> =>
  httpClient.post<AuthSession>(ENDPOINTS.auth.verifyOtp, payload);

/**
 * Exchange MSG91 widget access-token for BhaiWay JWT.
 * Docs: POST /auth/msg91/verify
 * Request/response logs: `[BhaiWay Auth API]` via httpClient.
 */
export const verifyMsg91AccessToken = (
  payload: VerifyMsg91Payload,
): Promise<AuthLoginResponse> =>
  httpClient.post<AuthLoginResponse>(ENDPOINTS.auth.msg91Verify, payload);

export const mapAuthLoginToSession = (response: AuthLoginResponse): AuthSession => ({
  userId: response.user.id,
  token: response.accessToken,
  isNewUser: !response.user.profileCompleted,
  phone: response.user.phone,
  profileCompleted: response.user.profileCompleted,
});

/**
 * Create the authenticated user's profile.
 * Docs: POST /users/profile
 * Auth: Bearer <BHAIWAY_JWT> via httpClient interceptor (`authSession.getToken()`).
 */
export const completeProfile = async (
  payload: CompleteProfilePayload,
): Promise<UserProfile> => {
  const response = await httpClient.post<ProfileResponse>(
    ENDPOINTS.users.profile,
    toCreateProfileRequest(payload),
  );
  return mapProfileResponseToUserProfile(response, payload, authSession.getUser()?.id);
};
