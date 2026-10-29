export type VerificationStatus =
  | 'NOT_VERIFIED'
  | 'VERIFICATION_IN_PROGRESS'
  | 'VERIFIED'
  | 'VERIFICATION_FAILED';

export interface AadhaarVerificationStartResponse {
  verificationId: string;
  status: string;
  url: string;
  /** Browser redirect registered with Cashfree for this session (api.bhaiway.com callback). */
  redirectUrl?: string | null;
  expiresAt?: string;
}

export interface AadhaarVerificationStatusResponse {
  status: VerificationStatus | string;
  verificationId?: string;
  verifiedName?: string;
  verifiedGender?: string | null;
  verifiedAt?: string;
  rejectionReason?: string | null;
  failureCode?: string | null;
}

export interface AadhaarVerificationRefreshResponse {
  status: VerificationStatus | string;
  verificationId?: string;
  verifiedName?: string;
  verifiedGender?: string | null;
  verifiedAt?: string;
  rejectionReason?: string | null;
  failureCode?: string | null;
}

export type DigiLockerFailureReason =
  | 'EXPIRED'
  | 'CONSENT_DENIED'
  | 'CONSENT_EXPIRED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface AadhaarVerificationState {
  status: VerificationStatus;
  verificationId: string | null;
  verifiedName: string | null;
  verifiedGender: string | null;
  verifiedAt: string | null;
  isStarting: boolean;
  isRefreshing: boolean;
  error: string | null;
  userMessage: string | null;
}
