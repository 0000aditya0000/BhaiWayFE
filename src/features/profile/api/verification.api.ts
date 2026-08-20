import { ENDPOINTS, httpClient } from '@/network';

import type {
  MyVerificationsResponse,
  SubmitVerificationPayload,
  VerificationStatusView,
} from './verification.types';

export type {
  MyVerificationsResponse,
  SubmitVerificationPayload,
  VerificationStatus,
  VerificationStatusView,
  VerificationType,
} from './verification.types';

export {
  DRIVING_LICENSE_DOCUMENT_TYPE,
  IDENTITY_DOCUMENT_TYPE,
  VEHICLE_DOCUMENT_TYPE,
} from './verification.types';

/**
 * Returns identity, driving-license, and vehicle verification status for the
 * authenticated user. Unsubmitted types appear as PENDING.
 *
 * Docs: GET /verification/me
 */
export const getMyVerifications = (): Promise<MyVerificationsResponse> =>
  httpClient.get<MyVerificationsResponse>(ENDPOINTS.verification.me);

/**
 * Submits identity verification metadata for the authenticated user.
 * Creates a PENDING identity verification. Clients cannot set VERIFIED.
 *
 * Docs: POST /verification/identity
 * Auth: Bearer JWT (via httpClient interceptor)
 * Success: 201 VerificationStatusViewDto
 * Errors: 400 validation, 401 unauthorized, 409 active verification exists
 */
export const submitIdentityVerification = (
  payload: SubmitVerificationPayload,
): Promise<VerificationStatusView> =>
  httpClient.post<VerificationStatusView>(ENDPOINTS.verification.identity, payload);

/**
 * Submits driving-license verification metadata for the authenticated user.
 * Creates a PENDING driving-license verification. Clients cannot set VERIFIED.
 *
 * Docs: POST /verification/driving-license
 * Auth: Bearer JWT (via httpClient interceptor)
 * Success: 201 VerificationStatusViewDto
 * Errors: 400 validation, 401 unauthorized, 409 active verification exists
 */
export const submitDrivingLicenseVerification = (
  payload: SubmitVerificationPayload,
): Promise<VerificationStatusView> =>
  httpClient.post<VerificationStatusView>(
    ENDPOINTS.verification.drivingLicense,
    payload,
  );

/**
 * Submits vehicle verification metadata for the authenticated user.
 * Creates a PENDING vehicle verification. Clients cannot set VERIFIED.
 *
 * Docs: POST /verification/vehicle
 * Auth: Bearer JWT (via httpClient interceptor)
 * Success: 201 VerificationStatusViewDto
 * Errors: 400 validation, 401 unauthorized, 409 active verification exists
 */
export const submitVehicleVerification = (
  payload: SubmitVerificationPayload,
): Promise<VerificationStatusView> =>
  httpClient.post<VerificationStatusView>(ENDPOINTS.verification.vehicle, payload);
