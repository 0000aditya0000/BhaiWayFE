import { ENDPOINTS } from '@/network/endpoints';
import type {
  AadhaarVerificationRefreshResponse,
  AadhaarVerificationStartResponse,
  AadhaarVerificationStatusResponse,
} from '@/types/kyc';

export interface HttpClientPort {
  get: <T>(url: string, options?: unknown) => Promise<T>;
  post: <T>(url: string, body?: unknown, options?: unknown) => Promise<T>;
}

export const createKycApi = (client: HttpClientPort) => ({
  /**
   * Initiates an Aadhaar DigiLocker verification session on the backend.
   * The backend contacts Cashfree and returns a DigiLocker session URL.
   *
   * Docs: POST /kyc/aadhaar/digilocker/start
   * Auth: Bearer JWT (via httpClient interceptor)
   */
  startAadhaarVerification: (): Promise<AadhaarVerificationStartResponse> =>
    client.post<AadhaarVerificationStartResponse>(ENDPOINTS.kyc.aadhaarDigilockerStart),

  /**
   * Retrieves the current Aadhaar verification status from the backend.
   * Backend is authoritative.
   *
   * Docs: GET /kyc/aadhaar/digilocker/status
   * Auth: Bearer JWT (via httpClient interceptor)
   */
  getAadhaarVerificationStatus: (
    verificationId?: string,
  ): Promise<AadhaarVerificationStatusResponse> => {
    const url = verificationId
      ? `${ENDPOINTS.kyc.aadhaarDigilockerStatus}?verificationId=${encodeURIComponent(verificationId)}`
      : ENDPOINTS.kyc.aadhaarDigilockerStatus;
    return client.get<AadhaarVerificationStatusResponse>(url);
  },

  /**
   * Triggers backend verification and profile synchronization after DigiLocker consent.
   * Backend verifies Cashfree status, retrieves Aadhaar documents, and updates profile.name + gender.
   *
   * Docs: POST /kyc/aadhaar/digilocker/refresh
   * Auth: Bearer JWT (via httpClient interceptor)
   */
  refreshAadhaarVerification: (
    verificationId?: string,
  ): Promise<AadhaarVerificationRefreshResponse> =>
    client.post<AadhaarVerificationRefreshResponse>(
      ENDPOINTS.kyc.aadhaarDigilockerRefresh,
      verificationId ? { verificationId } : {},
    ),
});

let defaultClient: HttpClientPort | null = null;
const getDefaultClient = (): HttpClientPort => {
  if (!defaultClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    defaultClient = require('@/network/httpClient').httpClient;
  }
  return defaultClient!;
};

export const startAadhaarVerification = (): Promise<AadhaarVerificationStartResponse> =>
  createKycApi(getDefaultClient()).startAadhaarVerification();

export const getAadhaarVerificationStatus = (
  verificationId?: string,
): Promise<AadhaarVerificationStatusResponse> =>
  createKycApi(getDefaultClient()).getAadhaarVerificationStatus(verificationId);

export const refreshAadhaarVerification = (
  verificationId?: string,
): Promise<AadhaarVerificationRefreshResponse> =>
  createKycApi(getDefaultClient()).refreshAadhaarVerification(verificationId);
