import { ENDPOINTS, httpClient } from '@/network';

export interface SendEmailVerificationRequest {
  email: string;
}

export interface SendEmailVerificationResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  otp: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface EmailVerificationStatusResponse {
  email: string | null;
  verified: boolean;
}

/**
 * Sends a 4-digit email verification OTP to the given address.
 * Docs: POST /users/email-verification/send — Bearer JWT
 */
export const sendEmailVerification = (
  email: string,
): Promise<SendEmailVerificationResponse> =>
  httpClient.post<SendEmailVerificationResponse>(ENDPOINTS.users.emailVerification.send, {
    email: email.trim(),
  } satisfies SendEmailVerificationRequest);

/**
 * Verifies the email OTP for the authenticated user.
 * Docs: POST /users/email-verification/verify — Bearer JWT
 * Body: { otp } — never send userId.
 */
export const verifyEmail = (otp: string): Promise<VerifyEmailResponse> =>
  httpClient.post<VerifyEmailResponse>(ENDPOINTS.users.emailVerification.verify, {
    otp: otp.trim(),
  } satisfies VerifyEmailRequest);

/**
 * Returns current email verification status (backend is authoritative).
 * Docs: GET /users/email-verification/status — Bearer JWT
 */
export const getEmailVerificationStatus = (): Promise<EmailVerificationStatusResponse> =>
  httpClient.get<EmailVerificationStatusResponse>(ENDPOINTS.users.emailVerification.status);
