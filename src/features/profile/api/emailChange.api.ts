import { ENDPOINTS, httpClient } from '@/network';

export interface RequestEmailChangeRequest {
  newEmail: string;
}

export interface RequestEmailChangeResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailChangeRequest {
  newEmail: string;
  otp: string;
}

export interface VerifyEmailChangeResponse {
  success: boolean;
  message: string;
  user: {
    email: string;
    emailVerified: boolean;
  };
}

/**
 * Requests an OTP for changing the authenticated user's email address.
 * Docs: POST /users/me/email/change/request — Bearer JWT
 */
export const requestEmailChangeOtp = (
  newEmail: string,
): Promise<RequestEmailChangeResponse> =>
  httpClient.post<RequestEmailChangeResponse>(ENDPOINTS.users.emailChange.request, {
    newEmail: newEmail.trim().toLowerCase(),
  } satisfies RequestEmailChangeRequest);

/**
 * Verifies the 6-digit OTP and commits the new email address.
 * Docs: POST /users/me/email/change/verify — Bearer JWT
 */
export const verifyEmailChangeOtp = (
  payload: VerifyEmailChangeRequest,
): Promise<VerifyEmailChangeResponse> =>
  httpClient.post<VerifyEmailChangeResponse>(ENDPOINTS.users.emailChange.verify, {
    newEmail: payload.newEmail.trim().toLowerCase(),
    otp: payload.otp.trim(),
  } satisfies VerifyEmailChangeRequest);
