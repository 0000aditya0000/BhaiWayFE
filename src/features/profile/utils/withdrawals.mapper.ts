import type { ApiError } from '@/network';

import type { WithdrawalDto, WithdrawalStatus } from '../api/withdrawals.types';
import {
  compareCoinStrings,
  isIntegerCoinString,
  parseIntegerCoinString,
  sanitizeCoinInput,
} from './walletCoin';

export const WITHDRAWAL_ERROR_MESSAGES = {
  INSUFFICIENT_WITHDRAWABLE_BALANCE: "You don't have enough withdrawable Coins.",
  PAYMENT_METHOD_NOT_FOUND: 'This payment method is no longer available.',
  PAYMENT_METHOD_INACTIVE: 'This payment method is inactive.',
  WITHDRAWAL_NOT_FOUND: 'Withdrawal not found.',
  INVALID_WITHDRAWAL_AMOUNT: 'Please enter a valid withdrawal amount.',
  WITHDRAWAL_IDEMPOTENCY_CONFLICT:
    'This withdrawal request could not be processed. Please try again.',
  NETWORK: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'Unable to confirm withdrawal status.',
  SESSION: 'Your session expired. Please sign in again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

export const WITHDRAWAL_STATUS_COPY: Record<
  WithdrawalStatus,
  { label: string; description: string }
> = {
  INITIATED: {
    label: 'Initiated',
    description: 'Withdrawal request submitted',
  },
  PROCESSING: {
    label: 'Processing',
    description: 'Your withdrawal is being processed',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Withdrawal completed successfully',
  },
  FAILED: {
    label: 'Failed',
    description: 'Withdrawal failed',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Withdrawal cancelled',
  },
};

export const asWithdrawalStatus = (value: unknown): WithdrawalStatus => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (
    raw === 'INITIATED' ||
    raw === 'PROCESSING' ||
    raw === 'COMPLETED' ||
    raw === 'FAILED' ||
    raw === 'CANCELLED'
  ) {
    return raw;
  }
  return 'INITIATED';
};

export const validateWithdrawAmount = (
  value: string,
  availableCoins: string,
): { ok: true; amount: string } | { ok: false; message: string } => {
  const sanitized = sanitizeCoinInput(value);
  if (!sanitized || sanitized === '0') {
    return { ok: false, message: WITHDRAWAL_ERROR_MESSAGES.INVALID_WITHDRAWAL_AMOUNT };
  }
  if (!isIntegerCoinString(sanitized)) {
    return { ok: false, message: WITHDRAWAL_ERROR_MESSAGES.INVALID_WITHDRAWAL_AMOUNT };
  }
  const amount = parseIntegerCoinString(sanitized)!;
  if (compareCoinStrings(amount, availableCoins) > 0) {
    return { ok: false, message: WITHDRAWAL_ERROR_MESSAGES.INSUFFICIENT_WITHDRAWABLE_BALANCE };
  }
  return { ok: true, amount };
};

export const generateWithdrawIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `withdraw-${time}-${random}`;
};

export const formatWithdrawalDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatWithdrawalDay = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const withdrawalPaymentSummary = (withdrawal: WithdrawalDto): string => {
  const method = withdrawal.paymentMethod;
  if (!method) {
    return 'Payment method';
  }
  if (method.type === 'UPI') {
    return method.upiId ? `UPI • ${method.upiId}` : 'UPI';
  }
  const bank = method.bankName?.trim() || 'Bank Account';
  const masked = method.accountNumberMasked?.trim();
  return masked ? `${bank} • ${masked}` : bank;
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

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

export const mapWithdrawalError = (error: unknown): string => {
  const code = getErrorCode(error);
  const status = getErrorStatus(error);
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  const haystack = `${code} ${message}`.toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return WITHDRAWAL_ERROR_MESSAGES.SESSION;
  }
  if (code === 'TIMEOUT' || haystack.includes('TIMEOUT') || haystack.includes('ABORTED')) {
    return WITHDRAWAL_ERROR_MESSAGES.TIMEOUT;
  }
  if (
    code === 'INSUFFICIENT_WITHDRAWABLE_BALANCE' ||
    haystack.includes('INSUFFICIENT_WITHDRAWABLE')
  ) {
    return WITHDRAWAL_ERROR_MESSAGES.INSUFFICIENT_WITHDRAWABLE_BALANCE;
  }
  if (code === 'PAYMENT_METHOD_NOT_FOUND' || haystack.includes('PAYMENT_METHOD_NOT_FOUND')) {
    return WITHDRAWAL_ERROR_MESSAGES.PAYMENT_METHOD_NOT_FOUND;
  }
  if (code === 'PAYMENT_METHOD_INACTIVE' || haystack.includes('PAYMENT_METHOD_INACTIVE')) {
    return WITHDRAWAL_ERROR_MESSAGES.PAYMENT_METHOD_INACTIVE;
  }
  if (code === 'WITHDRAWAL_NOT_FOUND' || haystack.includes('WITHDRAWAL_NOT_FOUND')) {
    return WITHDRAWAL_ERROR_MESSAGES.WITHDRAWAL_NOT_FOUND;
  }
  if (
    code === 'INVALID_WITHDRAWAL_AMOUNT' ||
    haystack.includes('INVALID_WITHDRAWAL_AMOUNT')
  ) {
    return WITHDRAWAL_ERROR_MESSAGES.INVALID_WITHDRAWAL_AMOUNT;
  }
  if (
    code === 'WITHDRAWAL_IDEMPOTENCY_CONFLICT' ||
    code === 'IDEMPOTENCY_CONFLICT' ||
    haystack.includes('IDEMPOTENCY')
  ) {
    return WITHDRAWAL_ERROR_MESSAGES.WITHDRAWAL_IDEMPOTENCY_CONFLICT;
  }
  if (status === 0 || code === 'NETWORK_ERROR') {
    return WITHDRAWAL_ERROR_MESSAGES.NETWORK;
  }
  return WITHDRAWAL_ERROR_MESSAGES.UNKNOWN;
};
