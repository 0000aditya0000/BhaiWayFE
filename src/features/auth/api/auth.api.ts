import { ENDPOINTS, httpClient } from '@/network';
import { authSession } from '@/store';
import type {
  AuthLoginResponse,
  CompleteProfilePayload,
  Msg91SendPayload,
  RequestOtpPayload,
  RequestOtpResult,
  UserProfile,
  VerifyMsg91Payload,
  VerifyOtpPayload,
  AuthSession,
  ProfileResponse,
} from '../types';
import { mapProfileResponseToUserProfile, toCreateProfileRequest } from '../utils';
import { normalizeAuthPhoneDigits } from '../utils/playReviewLogin';

const OTP_EXPIRES_SECONDS = 300;

/**
 * Acknowledge / send OTP for MSG91 login path.
 * Docs: POST /auth/msg91/send
 * Backend owns MSG91 credentials; client only sends the phone.
 */
export const sendMsg91Otp = (payload: Msg91SendPayload): Promise<unknown> =>
  httpClient.post<unknown>(ENDPOINTS.auth.msg91Send, payload);

/**
 * Exchange MSG91 widget access-token (or phone+otp) for BhaiWay JWT.
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
 * Live login send — same backend route Android uses.
 * Body is `{ phone }`; MSG91 keys stay on the server.
 */
export const requestOtp = async (payload: RequestOtpPayload): Promise<RequestOtpResult> => {
  const phone = normalizeAuthPhoneDigits(payload.phoneNumber);
  await sendMsg91Otp({ phone });
  return {
    verificationId: `backend:${phone}`,
    expiresInSeconds: OTP_EXPIRES_SECONDS,
  };
};

/**
 * Live login verify — POST /auth/msg91/verify with `{ phone, otp }`.
 */
export const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthSession> => {
  const phone = normalizeAuthPhoneDigits(payload.phoneNumber);
  const referralCode = String(payload.referralCode ?? '').trim().toUpperCase();
  const body: VerifyMsg91Payload = referralCode
    ? { phone, otp: payload.code, referralCode }
    : { phone, otp: payload.code };
  const response = await verifyMsg91AccessToken(body);
  return mapAuthLoginToSession(response);
};

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
