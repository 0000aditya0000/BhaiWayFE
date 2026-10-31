import type { ApiError } from '@/network';
import { parseIntegerCoinString } from '@/features/profile/utils/walletCoin';
import { formatBhaiWayCoins } from '@/shared/utils';

import { parseMoneySnapshot } from '../api/bookings.mapper';
import type {
  BookingResponseDto,
  PayLaterInsufficientWalletDetails,
  PayLaterPaymentResponse,
} from '../api/bookings.types';
import type { RideType } from '../types';

/** Minimal booking shape for eligibility — works with history + live booking DTOs. */
export interface PayLaterBookingSnapshot {
  id?: string;
  status?: string | null;
  bookingMode?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  farePayment?: string | null;
  farePaymentStatus?: string | null;
  fareAmount?: string | number | null;
  totalAmount?: string | number | null;
  securityDepositAmount?: string | number | null;
  ride?: {
    id?: string;
    status?: string | null;
    rideType?: string | null;
    source?: string | null;
    destination?: string | null;
    departureDate?: string | null;
    departureTime?: string | null;
  } | null;
}

export type PayLaterSettlementPaymentId = 'wallet' | 'cash';

export interface PayLaterSettlementView {
  bookingId: string;
  eligible: boolean;
  isAssured: boolean;
  rideType: RideType;
  fareCoins: string;
  fareLabel: string;
  securityDepositLabel?: string;
  paymentStatus: string;
}

const normalizeKey = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const isTerminalBookingStatus = (status: string): boolean =>
  status === 'CANCELLED' || status === 'REJECTED' || status === 'PENDING';

const resolveBookingMode = (booking: PayLaterBookingSnapshot): string => {
  const mode = normalizeKey(booking.bookingMode);
  if (mode) {
    return mode;
  }
  return normalizeKey(booking.ride?.rideType);
};

const isCommuteBooking = (booking: PayLaterBookingSnapshot): boolean =>
  resolveBookingMode(booking) === 'COMMUTE';

const isAssuredBooking = (booking: PayLaterBookingSnapshot): boolean => {
  const mode = resolveBookingMode(booking);
  if (mode === 'ASSURED') {
    return true;
  }
  return normalizeKey(booking.paymentMethod) === 'ASSURED_DEPOSIT';
};

const isRegularPayLater = (booking: PayLaterBookingSnapshot): boolean => {
  const method = normalizeKey(booking.paymentMethod);
  return method === 'PAY_LATER' || method === 'PAY_AFTER_RIDE';
};

const isAssuredPayLater = (booking: PayLaterBookingSnapshot): boolean => {
  if (!isAssuredBooking(booking)) {
    return false;
  }
  const farePayment = normalizeKey(booking.farePayment);
  return farePayment === '' || farePayment === 'PAY_LATER';
};

const resolveFarePaymentStatus = (booking: PayLaterBookingSnapshot): string => {
  if (isAssuredBooking(booking)) {
    return normalizeKey(booking.farePaymentStatus ?? booking.paymentStatus);
  }
  return normalizeKey(booking.paymentStatus);
};

/** Authoritative outstanding fare coins from backend fields only. */
export const resolvePayLaterFareCoins = (booking: PayLaterBookingSnapshot): string => {
  const fareRaw = booking.fareAmount ?? booking.totalAmount;
  if (fareRaw == null || fareRaw === '') {
    return '0';
  }
  const parsed = parseMoneySnapshot(fareRaw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return '0';
  }
  return String(Math.round(parsed));
};

export const isPayLaterSettlementEligible = (
  booking: PayLaterBookingSnapshot | null | undefined,
): boolean => {
  if (!booking) {
    return false;
  }

  const rideStatus = normalizeKey(booking.ride?.status);
  if (rideStatus !== 'COMPLETED') {
    return false;
  }

  const bookingStatus = normalizeKey(booking.status);
  if (isTerminalBookingStatus(bookingStatus)) {
    return false;
  }

  if (isCommuteBooking(booking)) {
    return false;
  }

  const mode = resolveBookingMode(booking);
  if (mode !== 'REGULAR' && mode !== 'ASSURED' && !isAssuredBooking(booking)) {
    return false;
  }

  if (resolveFarePaymentStatus(booking) === 'PAID') {
    return false;
  }

  if (isAssuredBooking(booking)) {
    if (!isAssuredPayLater(booking)) {
      return false;
    }
  } else if (!isRegularPayLater(booking)) {
    return false;
  }

  const fareCoins = resolvePayLaterFareCoins(booking);
  return parseIntegerCoinString(fareCoins) !== null && fareCoins !== '0';
};

export const buildPayLaterSettlementView = (
  booking: PayLaterBookingSnapshot,
): PayLaterSettlementView => {
  const assured = isAssuredBooking(booking);
  const fareCoins = resolvePayLaterFareCoins(booking);
  const depositRaw = booking.securityDepositAmount;
  const depositCoins =
    depositRaw != null && depositRaw !== ''
      ? String(Math.round(parseMoneySnapshot(depositRaw)))
      : null;

  return {
    bookingId: String(booking.id ?? '').trim(),
    eligible: isPayLaterSettlementEligible(booking),
    isAssured: assured,
    rideType: assured ? 'assured' : 'regular',
    fareCoins,
    fareLabel: formatBhaiWayCoins(Number(fareCoins), { spaced: false }),
    securityDepositLabel:
      assured && depositCoins && depositCoins !== '0'
        ? formatBhaiWayCoins(Number(depositCoins), { spaced: false })
        : undefined,
    paymentStatus: resolveFarePaymentStatus(booking),
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const readCoinField = (record: Record<string, unknown>, keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const raw = record[key];
    if (raw == null || raw === '') {
      continue;
    }
    const parsed = parseIntegerCoinString(String(raw));
    if (parsed !== null) {
      return parsed;
    }
    const numeric = parseMoneySnapshot(raw as string | number | null | undefined);
    if (Number.isFinite(numeric)) {
      return String(Math.round(numeric));
    }
  }
  return undefined;
};

const extractErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return '';
  }
  const apiError = error as ApiError;
  const details = asRecord(apiError.details);
  const nested = details ? asRecord(details.error) : null;
  const candidates = [
    apiError.code,
    details?.code,
    details?.errorCode,
    details?.error,
    nested?.code,
    typeof details?.message === 'string' ? details.message : undefined,
    apiError.message,
  ];
  return candidates
    .map((value) => String(value ?? '').trim().toUpperCase())
    .find((value) => value.length > 0) ?? '';
};

export const parsePayLaterInsufficientWalletError = (
  error: unknown,
): PayLaterInsufficientWalletDetails | null => {
  const code = extractErrorCode(error);
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '').trim()
      : '';
  const upperMessage = message.toUpperCase();
  const isInsufficient =
    code.includes('INSUFFICIENT_WALLET') ||
    upperMessage.includes('INSUFFICIENT_WALLET') ||
    upperMessage.includes('INSUFFICIENT WALLET');

  if (!isInsufficient) {
    return null;
  }

  const details = asRecord((error as ApiError).details);
  const nested = details ? asRecord(details.error) : null;
  const source = nested ?? details ?? {};

  return {
    requiredAmount: readCoinField(source, [
      'requiredAmount',
      'required',
      'fareAmount',
      'amountRequired',
      'amount',
    ]),
    availableBalance: readCoinField(source, [
      'availableBalance',
      'available',
      'balance',
      'walletBalance',
      'currentBalance',
    ]),
    message: message || 'Insufficient BhaiWay Wallet balance for this payment.',
  };
};

export const mapPayLaterPaymentError = (error: unknown): string => {
  const insufficient = parsePayLaterInsufficientWalletError(error);
  if (insufficient) {
    return insufficient.message;
  }

  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number((error as ApiError).status)
      : undefined;
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '').trim()
      : '';

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }
  if (status === 403) {
    return message || 'You are not allowed to pay for this booking.';
  }
  if (status === 404) {
    return message || 'Booking not found.';
  }
  if (status === 409) {
    return message || 'This payment cannot be processed right now.';
  }
  if (status === 422) {
    return message || 'Unable to complete this payment. Please check your wallet balance.';
  }
  if (status === 0) {
    return message || 'Payment could not be completed. Please try again.';
  }

  return message || 'Payment could not be completed. Please try again.';
};

export const normalizePayLaterPaymentResponse = (
  payload: PayLaterPaymentResponse,
): PayLaterPaymentResponse => ({
  bookingId: String(payload.bookingId ?? '').trim(),
  fareAmount: String(payload.fareAmount ?? '0'),
  paymentStatus: String(payload.paymentStatus ?? 'PAID'),
  passengerDebited: String(payload.passengerDebited ?? payload.fareAmount ?? '0'),
  driverCredited: String(payload.driverCredited ?? payload.fareAmount ?? '0'),
  paymentChannel: String(payload.paymentChannel ?? 'WALLET'),
  alreadySettled: Boolean(payload.alreadySettled),
  transactionId: String(payload.transactionId ?? '').trim(),
  paidAt: String(payload.paidAt ?? '').trim(),
});

export const isPayLaterPaymentSuccessful = (
  response: PayLaterPaymentResponse,
): boolean => {
  const status = normalizeKey(response.paymentStatus);
  return status === 'PAID' || response.alreadySettled === true;
};

export const buildPayLaterPayButtonLabel = (
  paymentId: PayLaterSettlementPaymentId,
  fareLabel: string,
): string => {
  if (paymentId === 'cash') {
    return `Pay ${fareLabel} in Cash`;
  }
  return `Pay ${fareLabel} with Wallet`;
};

export const bookingDtoToPayLaterSnapshot = (
  booking: BookingResponseDto,
): PayLaterBookingSnapshot => ({
  id: booking.id,
  status: booking.status,
  bookingMode: booking.bookingMode,
  paymentMethod: booking.paymentMethod,
  paymentStatus: booking.paymentStatus,
  farePayment: booking.farePayment,
  farePaymentStatus: booking.farePaymentStatus,
  fareAmount: booking.fareAmount,
  totalAmount: booking.totalAmount,
  securityDepositAmount: booking.securityDepositAmount,
  ride: booking.ride,
});
