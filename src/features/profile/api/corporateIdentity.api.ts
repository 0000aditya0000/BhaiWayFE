import { ENDPOINTS, httpClient } from '@/network';

/** Backend CorporateIdentityStatus */
export type CorporateIdentityStatus = 'NOT_VERIFIED' | 'OTP_PENDING' | 'VERIFIED';

export interface CorporateIdentityStatusResponse {
  status: CorporateIdentityStatus;
  email: string | null;
  verifiedAt: string | null;
}

export interface SendCorporateIdentityRequest {
  email: string;
}

export interface SendCorporateIdentityResponse {
  success?: boolean;
  message?: string;
  status?: CorporateIdentityStatus;
  email?: string | null;
  verifiedAt?: string | null;
}

export interface VerifyCorporateIdentityRequest {
  email: string;
  otp: string;
}

export interface VerifyCorporateIdentityResponse {
  success?: boolean;
  message?: string;
  status?: CorporateIdentityStatus;
  email?: string | null;
  verifiedAt?: string | null;
}

/**
 * Sends a 4-digit corporate identity OTP.
 * Docs: POST /corporate-identity/send — Bearer JWT
 * Body: { email } only.
 */
export const sendCorporateIdentityOtp = (
  email: string,
): Promise<SendCorporateIdentityResponse> =>
  httpClient.post<SendCorporateIdentityResponse>(ENDPOINTS.corporateIdentity.send, {
    email: email.trim(),
  } satisfies SendCorporateIdentityRequest);

/**
 * Verifies the corporate identity OTP.
 * Docs: POST /corporate-identity/verify — Bearer JWT
 * Body: { email, otp } — never send userId.
 */
export const verifyCorporateIdentityOtp = (
  email: string,
  otp: string,
): Promise<VerifyCorporateIdentityResponse> =>
  httpClient.post<VerifyCorporateIdentityResponse>(ENDPOINTS.corporateIdentity.verify, {
    email: email.trim(),
    otp: otp.trim(),
  } satisfies VerifyCorporateIdentityRequest);

/**
 * Returns current corporate identity status (backend is authoritative).
 * Docs: GET /corporate-identity/status — Bearer JWT
 */
export const getCorporateIdentityStatus = (): Promise<CorporateIdentityStatusResponse> =>
  httpClient.get<CorporateIdentityStatusResponse>(ENDPOINTS.corporateIdentity.status);
