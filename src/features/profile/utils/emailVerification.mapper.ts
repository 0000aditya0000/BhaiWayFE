import type { ApiError } from '@/network';

export const EMAIL_VERIFICATION_ERROR_MESSAGES = {
  EMAIL_ALREADY_VERIFIED: 'Email is already verified.',
  EMAIL_VERIFICATION_NOT_FOUND: 'No active verification code. Please request a new code.',
  EMAIL_VERIFICATION_EXPIRED: 'This code has expired. Please request a new one.',
  EMAIL_VERIFICATION_INVALID: 'Incorrect verification code.',
  EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED: 'Too many attempts. Please request a new code.',
  EMAIL_VERIFICATION_COOLDOWN: 'Please wait before requesting another code.',
  EMAIL_VERIFICATION_RATE_LIMITED: 'Too many verification requests. Please try again later.',
  EMAIL_SEND_FAILED: 'We couldn\'t send the verification email. Please try again.',
  NETWORK: 'Unable to connect. Please check your internet connection and try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
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

/** Map backend email-verification errors to safe user-facing copy. */
export const mapEmailVerificationError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const text = getErrorText(error).toUpperCase();
  const haystack = `${code} ${text}`;

  if (status === 401 || code === 'HTTP_401') {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.SESSION;
  }

  if (
    code === 'EMAIL_ALREADY_VERIFIED' ||
    haystack.includes('EMAIL_ALREADY_VERIFIED') ||
    haystack.includes('ALREADY VERIFIED')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED;
  }

  if (
    code === 'EMAIL_VERIFICATION_NOT_FOUND' ||
    haystack.includes('EMAIL_VERIFICATION_NOT_FOUND')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_NOT_FOUND;
  }

  if (
    code === 'EMAIL_VERIFICATION_EXPIRED' ||
    haystack.includes('EMAIL_VERIFICATION_EXPIRED') ||
    haystack.includes('EXPIRED')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_EXPIRED;
  }

  if (
    code === 'EMAIL_VERIFICATION_INVALID' ||
    haystack.includes('EMAIL_VERIFICATION_INVALID') ||
    haystack.includes('INCORRECT')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_INVALID;
  }

  if (
    code === 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED' ||
    haystack.includes('EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED') ||
    haystack.includes('ATTEMPTS_EXCEEDED')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED;
  }

  if (
    code === 'EMAIL_VERIFICATION_COOLDOWN' ||
    haystack.includes('EMAIL_VERIFICATION_COOLDOWN') ||
    haystack.includes('COOLDOWN')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_COOLDOWN;
  }

  if (
    status === 429 ||
    code === 'EMAIL_VERIFICATION_RATE_LIMITED' ||
    code === 'HTTP_429' ||
    haystack.includes('RATE_LIMIT') ||
    haystack.includes('TOO MANY')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_VERIFICATION_RATE_LIMITED;
  }

  if (
    code === 'EMAIL_SEND_FAILED' ||
    haystack.includes('EMAIL_SEND_FAILED') ||
    haystack.includes('SEND_FAILED')
  ) {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.EMAIL_SEND_FAILED;
  }

  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return EMAIL_VERIFICATION_ERROR_MESSAGES.NETWORK;
  }

  return EMAIL_VERIFICATION_ERROR_MESSAGES.UNKNOWN;
};

export const EMAIL_OTP_LENGTH = 4;
export const EMAIL_RESEND_COOLDOWN_SECONDS = 60;

export const normalizeEmailOtp = (value: string): string =>
  value.replace(/\D/g, '').slice(0, EMAIL_OTP_LENGTH);

export const isValidEmailOtp = (value: string): boolean =>
  /^\d{4}$/.test(value.trim());
