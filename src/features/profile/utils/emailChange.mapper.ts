import type { ApiError } from '@/network';

export const EMAIL_CHANGE_OTP_LENGTH = 4;
export const EMAIL_CHANGE_COOLDOWN_SECONDS = 60;

export const EMAIL_CHANGE_ERROR_CODES = {
  EMAIL_SAME_AS_CURRENT: 'EMAIL_SAME_AS_CURRENT',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  EMAIL_OTP_COOLDOWN: 'EMAIL_OTP_COOLDOWN',
  EMAIL_OTP_RATE_LIMITED: 'EMAIL_OTP_RATE_LIMITED',
  NO_PENDING_EMAIL_CHANGE: 'NO_PENDING_EMAIL_CHANGE',
  PENDING_EMAIL_MISMATCH: 'PENDING_EMAIL_MISMATCH',
  EMAIL_OTP_INVALID: 'EMAIL_OTP_INVALID',
  EMAIL_OTP_EXPIRED: 'EMAIL_OTP_EXPIRED',
  EMAIL_OTP_ATTEMPTS_EXCEEDED: 'EMAIL_OTP_ATTEMPTS_EXCEEDED',
} as const;

export const EMAIL_CHANGE_ERROR_MESSAGES = {
  EMAIL_SAME_AS_CURRENT: 'This is already your current email address.',
  EMAIL_ALREADY_REGISTERED: 'This email is already associated with another account.',
  EMAIL_OTP_COOLDOWN: 'Please wait before requesting another code.',
  EMAIL_OTP_RATE_LIMITED: 'Verification request limit reached. Please try again later.',
  NO_PENDING_EMAIL_CHANGE: 'No pending email change request found. Please request a new verification code.',
  PENDING_EMAIL_MISMATCH: 'Verification session mismatch. Please restart the change email process.',
  EMAIL_OTP_INVALID: 'Incorrect verification code.',
  EMAIL_OTP_EXPIRED: 'The verification code has expired. Please request a new code.',
  EMAIL_OTP_ATTEMPTS_EXCEEDED: 'Too many incorrect attempts. Please request a new verification code.',
  NETWORK: 'Unable to connect. Please check your internet connection and try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
  INVALID_EMAIL_FORMAT: 'Please enter a valid email address.',
  EMPTY_EMAIL: 'Email address cannot be empty.',
} as const;

export interface ParsedEmailChangeError {
  code: string;
  message: string;
  cooldownSeconds?: number;
  remainingAttempts?: number;
  attemptsExceeded: boolean;
  rateLimited: boolean;
  sessionMismatch: boolean;
}

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
    if (Array.isArray(message)) {
      return message.map(String).join(' ');
    }
  }
  return '';
};

const extractNumberProp = (obj: unknown, keys: string[]): number | undefined => {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const val = record[key];
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      return Math.round(val);
    }
    if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
      const parsed = parseInt(val.trim(), 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  }
  return undefined;
};

const extractErrorDetails = (
  error: unknown,
): { cooldownSeconds?: number; remainingAttempts?: number } => {
  if (!error || typeof error !== 'object') {
    return {};
  }
  const details = (error as ApiError).details;
  const cooldownSeconds =
    extractNumberProp(details, [
      'cooldownSeconds',
      'cooldown',
      'remainingSeconds',
      'retryAfter',
      'retryAfterSeconds',
    ]) ?? extractNumberProp(error, ['cooldownSeconds', 'remainingSeconds', 'retryAfter']);

  const remainingAttempts =
    extractNumberProp(details, [
      'remainingAttempts',
      'attemptsLeft',
      'attemptsRemaining',
      'remaining',
    ]) ?? extractNumberProp(error, ['remainingAttempts', 'attemptsLeft']);

  return { cooldownSeconds, remainingAttempts };
};

/**
 * Parses and maps backend errors for the Change Email flow.
 */
export const parseEmailChangeError = (error: unknown): ParsedEmailChangeError => {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const text = getErrorText(error).toUpperCase();
  const haystack = `${code} ${text}`;
  const { cooldownSeconds, remainingAttempts } = extractErrorDetails(error);

  if (status === 401 || code === 'HTTP_401' || haystack.includes('UNAUTHORIZED')) {
    return {
      code: 'SESSION',
      message: EMAIL_CHANGE_ERROR_MESSAGES.SESSION,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    code === 'EMAIL_SAME_AS_CURRENT' ||
    haystack.includes('EMAIL_SAME_AS_CURRENT') ||
    haystack.includes('SAME AS CURRENT')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_SAME_AS_CURRENT,
      message: EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_SAME_AS_CURRENT,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    code === 'EMAIL_ALREADY_REGISTERED' ||
    haystack.includes('EMAIL_ALREADY_REGISTERED') ||
    haystack.includes('ALREADY REGISTERED') ||
    haystack.includes('ALREADY IN USE') ||
    haystack.includes('ALREADY EXISTS')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
      message: EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    code === 'EMAIL_OTP_COOLDOWN' ||
    haystack.includes('EMAIL_OTP_COOLDOWN') ||
    haystack.includes('COOLDOWN')
  ) {
    const finalCooldown = cooldownSeconds && cooldownSeconds > 0 ? cooldownSeconds : undefined;
    const cooldownMsg = finalCooldown
      ? `Please wait ${finalCooldown}s before requesting another code.`
      : EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_COOLDOWN;

    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_COOLDOWN,
      message: cooldownMsg,
      cooldownSeconds: finalCooldown,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    status === 429 ||
    code === 'EMAIL_OTP_RATE_LIMITED' ||
    code === 'HTTP_429' ||
    haystack.includes('RATE_LIMIT') ||
    haystack.includes('TOO MANY REQUESTS')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_RATE_LIMITED,
      message: EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_RATE_LIMITED,
      attemptsExceeded: false,
      rateLimited: true,
      sessionMismatch: false,
    };
  }

  if (
    code === 'NO_PENDING_EMAIL_CHANGE' ||
    haystack.includes('NO_PENDING_EMAIL_CHANGE') ||
    haystack.includes('NO PENDING')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.NO_PENDING_EMAIL_CHANGE,
      message: EMAIL_CHANGE_ERROR_MESSAGES.NO_PENDING_EMAIL_CHANGE,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: true,
    };
  }

  if (
    code === 'PENDING_EMAIL_MISMATCH' ||
    haystack.includes('PENDING_EMAIL_MISMATCH') ||
    haystack.includes('MISMATCH')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.PENDING_EMAIL_MISMATCH,
      message: EMAIL_CHANGE_ERROR_MESSAGES.PENDING_EMAIL_MISMATCH,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: true,
    };
  }

  if (
    code === 'EMAIL_OTP_ATTEMPTS_EXCEEDED' ||
    haystack.includes('EMAIL_OTP_ATTEMPTS_EXCEEDED') ||
    haystack.includes('ATTEMPTS_EXCEEDED') ||
    haystack.includes('MAX ATTEMPTS')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_ATTEMPTS_EXCEEDED,
      message: EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_ATTEMPTS_EXCEEDED,
      attemptsExceeded: true,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    code === 'EMAIL_OTP_EXPIRED' ||
    haystack.includes('EMAIL_OTP_EXPIRED') ||
    haystack.includes('EXPIRED')
  ) {
    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_EXPIRED,
      message: EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_EXPIRED,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    code === 'EMAIL_OTP_INVALID' ||
    haystack.includes('EMAIL_OTP_INVALID') ||
    haystack.includes('INVALID OTP') ||
    haystack.includes('INCORRECT')
  ) {
    let msg: string = EMAIL_CHANGE_ERROR_MESSAGES.EMAIL_OTP_INVALID;
    if (remainingAttempts !== undefined && remainingAttempts > 0) {
      msg = `${msg} ${remainingAttempts} ${
        remainingAttempts === 1 ? 'attempt' : 'attempts'
      } remaining.`;
    }
    return {
      code: EMAIL_CHANGE_ERROR_CODES.EMAIL_OTP_INVALID,
      message: msg,
      remainingAttempts,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  if (
    status === 0 ||
    code === 'NETWORK_ERROR' ||
    code === 'TIMEOUT' ||
    haystack.includes('NETWORK') ||
    haystack.includes('FAILED TO FETCH')
  ) {
    return {
      code: 'NETWORK',
      message: EMAIL_CHANGE_ERROR_MESSAGES.NETWORK,
      attemptsExceeded: false,
      rateLimited: false,
      sessionMismatch: false,
    };
  }

  // Preserve readable server error message if present and reasonable
  const rawMsg = getErrorText(error).trim();
  const fallbackMsg =
    rawMsg && rawMsg.length > 5 && rawMsg.length < 150
      ? rawMsg
      : EMAIL_CHANGE_ERROR_MESSAGES.UNKNOWN;

  return {
    code: code || 'UNKNOWN',
    message: fallbackMsg,
    attemptsExceeded: false,
    rateLimited: false,
    sessionMismatch: false,
  };
};

export const mapEmailChangeError = (error: unknown): string =>
  parseEmailChangeError(error).message;

export const normalizeNewEmail = (email: string): string =>
  email.trim().toLowerCase();

export const isValidNewEmail = (email: string): boolean => {
  const normalized = normalizeNewEmail(email);
  if (!normalized || normalized.length < 5 || normalized.length > 254) {
    return false;
  }
  // Standard RFC 5322 compatible regex check
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    normalized,
  );
};

export const normalizeChangeEmailOtp = (value: string): string =>
  value.replace(/\D/g, '').slice(0, EMAIL_CHANGE_OTP_LENGTH);

export const isValidChangeEmailOtp = (value: string): boolean =>
  /^\d{4}$/.test(value.trim());

/**
 * Partially masks an email address for privacy on OTP screens.
 * E.g., `new.driver@example.com` -> `n***r@example.com`
 * E.g., `ab@test.com` -> `a*@test.com`
 */
export const maskEmail = (email: string): string => {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) {
    return trimmed;
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);

  if (local.length <= 1) {
    return `${local}***${domain}`;
  }
  if (local.length === 2) {
    return `${local[0]}*${domain}`;
  }
  if (local.length <= 4) {
    return `${local[0]}**${local[local.length - 1]}${domain}`;
  }

  const firstChar = local[0];
  const lastChar = local[local.length - 1];
  return `${firstChar}***${lastChar}${domain}`;
};
