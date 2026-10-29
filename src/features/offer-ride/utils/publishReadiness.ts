import type { VerificationStatus } from '@/features/profile/api';
import type { VehicleRcVerificationStatus } from '@/features/profile/api/vehicle.api';

export const PUBLISH_REQUIREMENT_MESSAGES = {
  aadhaar: 'Aadhaar verification is required before publishing a ride.',
  rc: 'Vehicle RC verification is required before publishing a ride.',
  activeVehicle: 'An active vehicle is required before publishing a ride.',
  /** Fallback guidance — DL is intentionally omitted (optional). */
  generic:
    'Complete Aadhaar and vehicle RC verification, and select an active vehicle, then try again.',
} as const;

export interface PublishVerificationInput {
  identityStatus?: VerificationStatus | string | null;
  /** Aggregate GET /verification/me vehicle status, if available. */
  vehicleVerificationStatus?: VerificationStatus | string | null;
  /** Per-vehicle RC status from list/detail or verify-rc. */
  vehicleRcStatus?: VehicleRcVerificationStatus | string | null;
  vehicleIsRcVerified?: boolean | null;
  vehicleIsActive?: boolean | null;
  hasSelectedVehicle?: boolean;
  /** Present for completeness — never blocks publishing. */
  drivingLicenseStatus?: VerificationStatus | string | null;
}

export interface PublishVerificationReadiness {
  ready: boolean;
  identityOk: boolean;
  rcOk: boolean;
  vehicleActiveOk: boolean;
  /** DL never required for publish readiness. */
  drivingLicenseOptional: true;
  messages: string[];
}

const isVerified = (status?: string | null): boolean =>
  String(status ?? '')
    .trim()
    .toUpperCase() === 'VERIFIED';

/**
 * UX guidance for publish flows.
 * Backend remains authoritative; this does not grant publish permission.
 * Mandatory: Aadhaar + RC + active vehicle. Driving License is optional.
 */
export const evaluatePublishVerificationReadiness = (
  input: PublishVerificationInput,
): PublishVerificationReadiness => {
  const identityOk = isVerified(input.identityStatus);
  const rcOk =
    input.vehicleIsRcVerified === true ||
    isVerified(input.vehicleRcStatus) ||
    isVerified(input.vehicleVerificationStatus);
  const hasVehicle = input.hasSelectedVehicle !== false;
  const vehicleActiveOk = hasVehicle && input.vehicleIsActive !== false;

  const messages: string[] = [];
  if (!identityOk) {
    messages.push(PUBLISH_REQUIREMENT_MESSAGES.aadhaar);
  }
  if (!rcOk) {
    messages.push(PUBLISH_REQUIREMENT_MESSAGES.rc);
  }
  if (!vehicleActiveOk) {
    messages.push(PUBLISH_REQUIREMENT_MESSAGES.activeVehicle);
  }

  return {
    ready: identityOk && rcOk && vehicleActiveOk,
    identityOk,
    rcOk,
    vehicleActiveOk,
    drivingLicenseOptional: true,
    messages,
  };
};

/** Prefer the first blocking message; never mention DL as required. */
export const primaryPublishBlockMessage = (
  readiness: PublishVerificationReadiness,
): string | null => {
  if (readiness.ready) {
    return null;
  }
  return readiness.messages[0] ?? PUBLISH_REQUIREMENT_MESSAGES.generic;
};
