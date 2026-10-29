import type { ApiError } from '@/network';

import type {
  PaymentMethodDto,
  PaymentMethodType,
} from '../api/paymentMethods.types';

export const PAYMENT_METHOD_ERROR_MESSAGES = {
  PAYMENT_METHOD_NOT_FOUND: 'Payment method not found.',
  PAYMENT_METHOD_INACTIVE: 'This payment method is inactive.',
  INVALID_PAYMENT_METHOD: 'Please check your payment details.',
  NETWORK: 'Unable to connect. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_PATTERN = /^\d{9,18}$/;

export const normalizeUpiId = (value: string): string => value.trim().toLowerCase();

export const isValidUpiId = (value: string): boolean => UPI_PATTERN.test(normalizeUpiId(value));

export const normalizeIfsc = (value: string): string => value.trim().toUpperCase();

export const isValidIfsc = (value: string): boolean => IFSC_PATTERN.test(normalizeIfsc(value));

export const normalizeAccountNumber = (value: string): string =>
  value.replace(/\D/g, '');

export const isValidAccountNumber = (value: string): boolean =>
  ACCOUNT_PATTERN.test(normalizeAccountNumber(value));

export const validateUpiForm = (
  upiId: string,
): { ok: true; upiId: string } | { ok: false; message: string } => {
  const normalized = normalizeUpiId(upiId);
  if (!normalized) {
    return { ok: false, message: 'Enter your UPI ID.' };
  }
  if (!isValidUpiId(normalized)) {
    return { ok: false, message: 'Enter a valid UPI ID (example: name@upi).' };
  }
  return { ok: true, upiId: normalized };
};

export const validateBankForm = (input: {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
}):
  | {
      ok: true;
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
    }
  | { ok: false; message: string; field?: string } => {
  const accountHolderName = input.accountHolderName.trim();
  const bankName = input.bankName.trim();
  const accountNumber = normalizeAccountNumber(input.accountNumber);
  const confirmAccountNumber = normalizeAccountNumber(input.confirmAccountNumber);
  const ifscCode = normalizeIfsc(input.ifscCode);

  if (!accountHolderName) {
    return { ok: false, message: 'Enter the account holder name.', field: 'accountHolderName' };
  }
  if (!bankName) {
    return { ok: false, message: 'Enter the bank name.', field: 'bankName' };
  }
  if (!accountNumber) {
    return { ok: false, message: 'Enter the account number.', field: 'accountNumber' };
  }
  if (!isValidAccountNumber(accountNumber)) {
    return {
      ok: false,
      message: 'Enter a valid account number (9–18 digits).',
      field: 'accountNumber',
    };
  }
  if (!confirmAccountNumber) {
    return {
      ok: false,
      message: 'Confirm the account number.',
      field: 'confirmAccountNumber',
    };
  }
  if (accountNumber !== confirmAccountNumber) {
    return {
      ok: false,
      message: 'Account numbers do not match.',
      field: 'confirmAccountNumber',
    };
  }
  if (!ifscCode) {
    return { ok: false, message: 'Enter the IFSC code.', field: 'ifscCode' };
  }
  if (!isValidIfsc(ifscCode)) {
    return { ok: false, message: 'Enter a valid IFSC code.', field: 'ifscCode' };
  }

  return { ok: true, accountHolderName, bankName, accountNumber, ifscCode };
};

export const paymentMethodTitle = (method: PaymentMethodDto): string => {
  if (method.type === 'UPI') {
    return 'UPI';
  }
  return method.bankName?.trim() || 'Bank Account';
};

export const paymentMethodSubtitle = (method: PaymentMethodDto): string => {
  if (method.type === 'UPI') {
    return method.upiId?.trim() || 'UPI ID';
  }
  const masked = method.accountNumberMasked?.trim();
  if (masked) {
    return masked;
  }
  return method.accountHolderName?.trim() || 'Bank account';
};

export const isActivePaymentMethod = (method: PaymentMethodDto): boolean =>
  Boolean(method.isActive);

export const filterActivePaymentMethods = (
  methods: readonly PaymentMethodDto[],
): PaymentMethodDto[] => methods.filter(isActivePaymentMethod);

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

export const mapPaymentMethodError = (error: unknown): string => {
  const code = getErrorCode(error);
  const status = getErrorStatus(error);
  const haystack = `${code} ${
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  }`.toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return PAYMENT_METHOD_ERROR_MESSAGES.SESSION;
  }
  if (code === 'PAYMENT_METHOD_NOT_FOUND' || haystack.includes('PAYMENT_METHOD_NOT_FOUND')) {
    return PAYMENT_METHOD_ERROR_MESSAGES.PAYMENT_METHOD_NOT_FOUND;
  }
  if (code === 'PAYMENT_METHOD_INACTIVE' || haystack.includes('PAYMENT_METHOD_INACTIVE')) {
    return PAYMENT_METHOD_ERROR_MESSAGES.PAYMENT_METHOD_INACTIVE;
  }
  if (
    code === 'INVALID_PAYMENT_METHOD' ||
    haystack.includes('INVALID_PAYMENT_METHOD') ||
    status === 400
  ) {
    return PAYMENT_METHOD_ERROR_MESSAGES.INVALID_PAYMENT_METHOD;
  }
  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return PAYMENT_METHOD_ERROR_MESSAGES.NETWORK;
  }
  return PAYMENT_METHOD_ERROR_MESSAGES.UNKNOWN;
};

export const asPaymentMethodType = (value: unknown): PaymentMethodType | null => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'UPI') {
    return 'UPI';
  }
  if (raw === 'BANK_ACCOUNT' || raw === 'BANK' || raw === 'BANKACCOUNT') {
    return 'BANK_ACCOUNT';
  }
  return null;
};
