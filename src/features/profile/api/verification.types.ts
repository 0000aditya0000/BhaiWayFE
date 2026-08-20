/** Swagger: VerificationStatus */
export type VerificationStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

/** Swagger: VerificationType */
export type VerificationType = 'IDENTITY' | 'DRIVING_LICENSE' | 'VEHICLE';

/** Swagger: VerificationStatusViewDto */
export interface VerificationStatusView {
  status: VerificationStatus;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  expiresAt?: string | null;
}

/** Swagger: MyVerificationsResponseDto */
export interface MyVerificationsResponse {
  identity: VerificationStatusView;
  drivingLicense: VerificationStatusView;
  vehicle: VerificationStatusView;
}

/** Swagger: SubmitVerificationDto */
export interface SubmitVerificationPayload {
  documentUrl?: string;
  documentType?: string;
  documentReference?: string;
}

/** Logical document type label (Swagger example pattern for identity). */
export const IDENTITY_DOCUMENT_TYPE = 'IDENTITY_SCAN';

/** Logical document type label for driving-license submissions. */
export const DRIVING_LICENSE_DOCUMENT_TYPE = 'DRIVING_LICENSE_SCAN';

/** Logical document type label for vehicle (RC) submissions. */
export const VEHICLE_DOCUMENT_TYPE = 'VEHICLE_RC_SCAN';
