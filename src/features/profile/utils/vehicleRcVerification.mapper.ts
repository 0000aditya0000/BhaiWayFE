import type { ApiError } from '@/network';

import type {
  VehicleOwnerMatchStatus,
  VehicleRcVerification,
  VehicleRcVerificationStatus,
  VehicleResponse,
} from '../api/vehicle.api';
import type { VerificationStatus } from '../api/verification.types';
import type { GarageVehicle, VehicleRcStatus } from '../types';

export const VEHICLE_RC_ERROR_MESSAGES = {
  VEHICLE_RC_INVALID:
    'RC verification could not be completed. Please check the vehicle details and try again.',
  VEHICLE_NUMBER_MISMATCH:
    'The vehicle number returned by the verification service does not match this vehicle.',
  VEHICLE_ACCESS_DENIED: "You don't have permission to verify this vehicle.",
  RATE_LIMITED: 'Too many verification attempts. Please try again later.',
  NETWORK:
    'Unable to reach the verification service. Please check your internet connection and try again.',
  UNKNOWN: 'RC verification failed. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
} as const;

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as ApiError).code;
    if (typeof code === 'string') {
      return code.trim().toUpperCase();
    }
  }
  return '';
};

const getErrorText = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
};

/** Map backend RC verification errors to safe user-facing copy (never Cashfree internals). */
export const mapVehicleRcVerificationError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const text = getErrorText(error).toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return VEHICLE_RC_ERROR_MESSAGES.SESSION;
  }

  if (
    status === 429 ||
    code === 'HTTP_429' ||
    code.includes('RATE') ||
    text.includes('RATE LIMIT') ||
    text.includes('TOO MANY')
  ) {
    return VEHICLE_RC_ERROR_MESSAGES.RATE_LIMITED;
  }

  if (
    code === 'VEHICLE_RC_INVALID' ||
    text.includes('VEHICLE_RC_INVALID')
  ) {
    return VEHICLE_RC_ERROR_MESSAGES.VEHICLE_RC_INVALID;
  }

  if (
    code === 'VEHICLE_NUMBER_MISMATCH' ||
    text.includes('VEHICLE_NUMBER_MISMATCH')
  ) {
    return VEHICLE_RC_ERROR_MESSAGES.VEHICLE_NUMBER_MISMATCH;
  }

  if (
    status === 403 ||
    code === 'VEHICLE_ACCESS_DENIED' ||
    text.includes('VEHICLE_ACCESS_DENIED')
  ) {
    return VEHICLE_RC_ERROR_MESSAGES.VEHICLE_ACCESS_DENIED;
  }

  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return VEHICLE_RC_ERROR_MESSAGES.NETWORK;
  }

  return VEHICLE_RC_ERROR_MESSAGES.UNKNOWN;
};

export const isVehicleRcVerifiedStatus = (
  status?: VehicleRcVerificationStatus | VerificationStatus | null,
): boolean => status === 'VERIFIED';

export const resolveVehicleRcUiStatus = (input: {
  response?: VehicleResponse | null;
  verification?: VehicleRcVerification | null;
  aggregateVehicleStatus?: VerificationStatus | null;
}): VehicleRcStatus => {
  const fromVerification = input.verification?.status;
  if (fromVerification === 'VERIFIED') {
    return 'verified';
  }
  if (fromVerification === 'INVALID' || fromVerification === 'FAILED') {
    return 'failed';
  }

  const row = input.response;
  if (row?.isRcVerified === true || row?.isVerified === true) {
    return 'verified';
  }
  if (row?.rcVerificationStatus === 'VERIFIED') {
    return 'verified';
  }
  if (
    row?.rcVerificationStatus === 'INVALID' ||
    row?.rcVerificationStatus === 'FAILED'
  ) {
    return 'failed';
  }

  if (input.aggregateVehicleStatus === 'VERIFIED') {
    return 'verified';
  }
  if (input.aggregateVehicleStatus === 'REJECTED') {
    return 'failed';
  }

  return 'required';
};

export const ownerMatchLabel = (
  status?: VehicleOwnerMatchStatus | null,
): string | null => {
  if (status === 'MATCHED') {
    return 'Vehicle ownership verified';
  }
  if (status === 'NOT_MATCHED') {
    return 'Vehicle owner details could not be matched with your verified identity.';
  }
  return null;
};

export const formatRcVerifiedAt = (iso?: string | null): string | null => {
  if (!iso?.trim()) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const applyRcVerificationToGarageVehicle = (
  vehicle: GarageVehicle,
  verification: VehicleRcVerification,
): GarageVehicle => {
  const onlyWhenVerified = verification.status === 'VERIFIED';
  return {
    ...vehicle,
    plateNumber: verification.vehicleNumber?.trim()
      ? verification.vehicleNumber.replace(/\s+/g, ' ').trim().toUpperCase()
      : vehicle.plateNumber,
    rcStatus: onlyWhenVerified
      ? 'verified'
      : verification.status === 'INVALID' || verification.status === 'FAILED'
        ? 'failed'
        : vehicle.rcStatus === 'verified'
          ? 'verified'
          : 'required',
    ownerMatchStatus: verification.ownerMatchStatus ?? vehicle.ownerMatchStatus,
    rcVerifiedAt: onlyWhenVerified
      ? verification.verifiedAt ?? vehicle.rcVerifiedAt
      : vehicle.rcVerifiedAt,
    lastRcVerificationStatus: verification.status,
  };
};
