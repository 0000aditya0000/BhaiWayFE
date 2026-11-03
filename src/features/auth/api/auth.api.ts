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

export const isPhoneAlreadyRegisteredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const err = error as {
    code?: string;
    status?: number;
    message?: string;
    details?: { code?: string; message?: string; statusCode?: number };
  };
  return (
    err.code === 'PHONE_ALREADY_REGISTERED' ||
    err.details?.code === 'PHONE_ALREADY_REGISTERED' ||
    (err.status === 409 &&
      (String(err.message).toLowerCase().includes('already registered') ||
        String(err.details?.message).toLowerCase().includes('already registered')))
  );
};

/**
 * Acknowledge / send OTP for MSG91 login path.
 * Docs: POST /auth/msg91/send
 * Backend owns MSG91 credentials; client only sends the phone and registration intent.
 */
export const sendMsg91Otp = (payload: Msg91SendPayload): Promise<unknown> =>
  httpClient.post<unknown>(ENDPOINTS.auth.msg91Send, payload);

/**
 * Exchange MSG91 widget access-token (or phone+otp) for BhaiWay JWT.
 * Routes to POST /auth/msg91/register when isRegistration=true, or POST /auth/msg91/verify for standard login.
 * Request/response logs: `[BhaiWay Auth API]` via httpClient.
 */
export const verifyMsg91AccessToken = (
  payload: VerifyMsg91Payload,
): Promise<AuthLoginResponse> => {
  const isRegistration =
    payload.isRegistration === true || payload.mode?.toLowerCase() === 'register';
  const endpoint = isRegistration ? ENDPOINTS.auth.msg91Register : ENDPOINTS.auth.msg91Verify;
  return httpClient.post<AuthLoginResponse>(endpoint, payload);
};

export const mapAuthLoginToSession = (response: AuthLoginResponse): AuthSession => {
  const isDeletionPending =
    Boolean(response.deletionPending) ||
    response.user.status === 'DELETION_REQUESTED' ||
    response.user.status === 'DELETION_ACTION_REQUIRED' ||
    response.user.status === 'DELETION_APPROVED';

  return {
    userId: response.user.id,
    token: response.accessToken,
    isNewUser: !response.user.profileCompleted,
    phone: response.user.phone,
    profileCompleted: response.user.profileCompleted,
    deletionPending: isDeletionPending,
    status: response.user.status,
  };
};

/**
 * Live login send — same backend route Android uses.
 * Body is `{ phone, mode?, isRegistration? }`; MSG91 keys stay on the server.
 */
export const requestOtp = async (payload: RequestOtpPayload): Promise<RequestOtpResult> => {
  const phone = normalizeAuthPhoneDigits(payload.phoneNumber);
  const sendPayload: Msg91SendPayload = { phone };
  if (payload.isRegistration) {
    sendPayload.isRegistration = true;
    sendPayload.mode = payload.mode ?? 'register';
  }
  await sendMsg91Otp(sendPayload);
  return {
    verificationId: `backend:${phone}`,
    expiresInSeconds: OTP_EXPIRES_SECONDS,
  };
};

/**
 * Live login verify — POST /auth/msg91/verify or POST /auth/msg91/register with `{ phone, otp, referralCode?, isRegistration?, mode?, email? }`.
 */
export const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthSession> => {
  const phone = normalizeAuthPhoneDigits(payload.phoneNumber);
  const referralCode = String(payload.referralCode ?? '').trim().toUpperCase();
  const isRegistration = payload.isRegistration || payload.flow === 'signup';
  const mode = payload.mode ?? (isRegistration ? 'register' : undefined);
  const body: VerifyMsg91Payload = {
    phone,
    otp: payload.code,
    ...(referralCode ? { referralCode } : {}),
    ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
    ...(isRegistration ? { isRegistration: true, mode: mode ?? 'register' } : {}),
  };
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
