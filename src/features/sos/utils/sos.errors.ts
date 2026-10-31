import type { ApiError } from '@/network';

export const SOS_ERROR_MESSAGES = {
  NETWORK: 'SOS could not be confirmed. Check your connection and try again.',
  TIMEOUT: 'SOS request timed out. Checking whether it was registered…',
  UNAUTHORIZED: 'Your session expired. Please sign in again.',
  FORBIDDEN: 'You are not allowed to trigger SOS for this ride.',
  RIDE_INACTIVE: 'This ride is no longer active, so SOS cannot be triggered.',
  NOT_ELIGIBLE: 'SOS is only available during an active ride.',
  UNKNOWN: 'Unable to trigger SOS. Please try again.',
  UNCONFIRMED: 'SOS could not be confirmed as registered. Please try again.',
} as const;

const getStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as ApiError).code;
    if (typeof code === 'string') {
      return code.trim().toUpperCase();
    }
  }
  return '';
};

const getText = (error: unknown): string => {
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

export const isSosAlreadyActiveError = (error: unknown): boolean => {
  const code = getCode(error);
  const text = getText(error).toUpperCase();
  const status = getStatus(error);
  return (
    status === 409 ||
    code.includes('ALREADY') ||
    code.includes('DUPLICATE') ||
    code === 'SOS_ACTIVE' ||
    text.includes('ALREADY') ||
    text.includes('ACTIVE SOS')
  );
};

export const mapSosTriggerError = (error: unknown): string => {
  const status = getStatus(error);
  const code = getCode(error);
  const text = getText(error).toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return SOS_ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (status === 403 || code.includes('FORBIDDEN') || code.includes('NOT_ELIGIBLE')) {
    return SOS_ERROR_MESSAGES.FORBIDDEN;
  }
  if (
    status === 404 ||
    code.includes('RIDE_NOT') ||
    text.includes('NOT ACTIVE') ||
    text.includes('NO LONGER ACTIVE')
  ) {
    return SOS_ERROR_MESSAGES.RIDE_INACTIVE;
  }
  if (code === 'TIMEOUT' || text.includes('TIMEOUT')) {
    return SOS_ERROR_MESSAGES.TIMEOUT;
  }
  if (status === 0 || code === 'NETWORK_ERROR') {
    return SOS_ERROR_MESSAGES.NETWORK;
  }
  if (isSosAlreadyActiveError(error)) {
    return SOS_ERROR_MESSAGES.UNCONFIRMED;
  }
  return getText(error).trim() || SOS_ERROR_MESSAGES.UNKNOWN;
};
