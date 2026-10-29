import type { ApiError } from '@/network';

import type { CorporateIdentityStatus } from '../api/corporateIdentity.api';

export const CORPORATE_IDENTITY_ERROR_MESSAGES = {
  CORPORATE_EMAIL_NOT_ALLOWED: 'Please use your official company email address.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_OTP: 'Incorrect verification code. Please try again.',
  EXPIRED_OTP: 'Your verification code has expired. Please request a new code.',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please request a new verification code.',
  COOLDOWN: 'Please wait before requesting another code.',
  RATE_LIMIT: 'Too many verification attempts. Please try again later.',
  NETWORK: 'Something went wrong. Please try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
} as const;

export const CORPORATE_OTP_LENGTH = 4;
export const CORPORATE_RESEND_COOLDOWN_SECONDS = 60;

/** Basic syntax-only email check. Domain policy belongs to the backend. */
export const isValidCorporateEmailSyntax = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const normalizeCorporateEmail = (value: string): string => value.trim().toLowerCase();

export const normalizeCorporateOtp = (value: string): string =>
  value.replace(/\D/g, '').slice(0, CORPORATE_OTP_LENGTH);

export const isValidCorporateOtp = (value: string): boolean =>
  /^\d{4}$/.test(value.trim());

export const isCorporateVerifiedStatus = (
  status?: CorporateIdentityStatus | null,
): boolean => status === 'VERIFIED';

export const isCorporateOtpPendingStatus = (
  status?: CorporateIdentityStatus | null,
): boolean => status === 'OTP_PENDING';

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

/** Map backend corporate-identity errors to safe user-facing copy. */
export const mapCorporateIdentityError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const text = getErrorText(error).toUpperCase();
  const haystack = `${code} ${text}`;

  if (status === 401 || code === 'HTTP_401') {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.SESSION;
  }

  if (
    code === 'CORPORATE_EMAIL_NOT_ALLOWED' ||
    haystack.includes('CORPORATE_EMAIL_NOT_ALLOWED')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.CORPORATE_EMAIL_NOT_ALLOWED;
  }

  if (
    code === 'INVALID_EMAIL' ||
    code === 'VALIDATION_ERROR' ||
    haystack.includes('INVALID_EMAIL') ||
    haystack.includes('VALID EMAIL')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.INVALID_EMAIL;
  }

  if (
    code === 'CORPORATE_OTP_EXPIRED' ||
    code === 'OTP_EXPIRED' ||
    haystack.includes('OTP_EXPIRED') ||
    haystack.includes('EXPIRED')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.EXPIRED_OTP;
  }

  if (
    code === 'CORPORATE_OTP_INVALID' ||
    code === 'OTP_INVALID' ||
    code === 'INVALID_OTP' ||
    haystack.includes('OTP_INVALID') ||
    haystack.includes('INCORRECT')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.INVALID_OTP;
  }

  if (
    code === 'CORPORATE_OTP_ATTEMPTS_EXCEEDED' ||
    code === 'OTP_ATTEMPTS_EXCEEDED' ||
    haystack.includes('ATTEMPTS_EXCEEDED') ||
    haystack.includes('TOO MANY ATTEMPTS')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
  }

  if (
    code === 'CORPORATE_OTP_COOLDOWN' ||
    code === 'OTP_COOLDOWN' ||
    haystack.includes('COOLDOWN')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.COOLDOWN;
  }

  if (
    status === 429 ||
    code === 'HTTP_429' ||
    code === 'CORPORATE_OTP_RATE_LIMITED' ||
    code === 'RATE_LIMITED' ||
    haystack.includes('RATE_LIMIT') ||
    haystack.includes('TOO MANY')
  ) {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.RATE_LIMIT;
  }

  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return CORPORATE_IDENTITY_ERROR_MESSAGES.NETWORK;
  }

  return CORPORATE_IDENTITY_ERROR_MESSAGES.UNKNOWN;
};

/** Assert mobile source does not embed a free-email domain blocklist. */
export const CORPORATE_DOMAIN_POLICY_OWNER = 'backend' as const;
