import { isInsufficientWalletForAssuredDeposit } from './assuredDeposit.utils';

/** Request aliases accepted by POST /bookings for Regular Ride. */
export type RegularRidePaymentRequestMethod = 'WALLET' | 'PAY_AFTER_RIDE';

export const REGULAR_RIDE_PAYMENT_LABELS = {
  walletMethod: 'Paid with BhaiWay Wallet',
  payAfterRide: 'Pay After Ride',
  paid: 'Paid',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
  walletRefundCompleted: 'Wallet refund completed',
  alreadyPaid: 'Already paid',
  insufficientWalletTitle: 'Insufficient BhaiWay Coins',
  walletLockedTitle: 'Wallet unavailable',
  walletLockedFallback:
    'Your BhaiWay Wallet is locked. You cannot pay from wallet right now.',
  selectPayment: 'Select a payment option',
} as const;

const normalizePaymentKey = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

export const isWalletPrepaidMethod = (method: string | null | undefined): boolean => {
  const key = normalizePaymentKey(method);
  return key === 'WALLET' || key === 'PAY_NOW';
};

export const isPayAfterRideMethod = (method: string | null | undefined): boolean => {
  const key = normalizePaymentKey(method);
  return key === 'PAY_AFTER_RIDE' || key === 'PAY_LATER';
};

export const toRegularRidePaymentRequestMethod = (
  selectedId: string | null | undefined,
): RegularRidePaymentRequestMethod | null => {
  const id = String(selectedId ?? '')
    .trim()
    .toLowerCase();
  if (id === 'wallet') {
    return 'WALLET';
  }
  if (id === 'pay-after-ride') {
    return 'PAY_AFTER_RIDE';
  }
  return null;
};

/** Client create body — rideId, seats, paymentMethod only (plus optional coupon). */
export const buildRegularCreateBookingPayload = (params: {
  rideId: string;
  seats: number;
  paymentMethod: RegularRidePaymentRequestMethod;
}): {
  rideId: string;
  seats: number;
  paymentMethod: RegularRidePaymentRequestMethod;
} => ({
  rideId: params.rideId,
  seats: Math.max(1, Math.floor(params.seats)),
  paymentMethod: params.paymentMethod,
});

export const resolveRegularFareCoins = (
  pricePerSeat: number | null | undefined,
  seats: number,
): string | null => {
  if (pricePerSeat == null || !Number.isFinite(pricePerSeat) || pricePerSeat <= 0) {
    return null;
  }
  const safeSeats = Math.max(1, Math.floor(seats));
  return String(Math.max(0, Math.floor(pricePerSeat * safeSeats)));
};

/** Preview payable only — never sent on POST /bookings. */
export const resolveRegularPayableCoins = (
  fareCoins: string | null | undefined,
  couponDiscountCoins: number | null | undefined,
): string | null => {
  const fare = String(fareCoins ?? '').trim();
  if (!fare || !/^\d+$/.test(fare)) {
    return null;
  }
  const discount = Math.max(0, Math.round(Number(couponDiscountCoins ?? 0) || 0));
  if (discount <= 0) {
    return fare;
  }
  const payable = Math.max(0, Number(fare) - discount);
  return String(payable);
};

export const isInsufficientWalletForRegularFare = (
  availableCoins: string | null | undefined,
  payableCoins: string | null | undefined,
): boolean => {
  if (availableCoins == null || payableCoins == null) {
    return false;
  }
  return isInsufficientWalletForAssuredDeposit(availableCoins, payableCoins);
};

export const formatRegularRidePaymentMethodLabel = (
  method: string | null | undefined,
): string => {
  if (isWalletPrepaidMethod(method)) {
    return REGULAR_RIDE_PAYMENT_LABELS.walletMethod;
  }
  if (isPayAfterRideMethod(method)) {
    return REGULAR_RIDE_PAYMENT_LABELS.payAfterRide;
  }
  return String(method ?? '').trim();
};

export const formatPaymentStatusDisplayLabel = (
  status: string | null | undefined,
): string => {
  const key = normalizePaymentKey(status);
  if (key === 'PAID') {
    return REGULAR_RIDE_PAYMENT_LABELS.paid;
  }
  if (key === 'UNPAID') {
    return REGULAR_RIDE_PAYMENT_LABELS.unpaid;
  }
  if (key === 'REFUNDED') {
    return REGULAR_RIDE_PAYMENT_LABELS.refunded;
  }
  if (!key) {
    return '';
  }
  return key.replace(/_/g, ' ');
};

/**
 * Passenger-facing payment status. Canonical backend enums stay off the UI.
 *
 * PAY_NOW + PAID → Paid
 * PAY_NOW + PAID after completion → Already paid
 * PAY_NOW + REFUNDED → Wallet refund completed
 * PAY_LATER + UNPAID → Unpaid
 */
export const formatPassengerPaymentStatusLabel = (params: {
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  bookingStatus?: string | null;
  rideStatus?: string | null;
}): string => {
  const method = normalizePaymentKey(params.paymentMethod);
  const status = normalizePaymentKey(params.paymentStatus);
  const bookingStatus = normalizePaymentKey(params.bookingStatus);
  const rideStatus = normalizePaymentKey(params.rideStatus);
  const completed = bookingStatus === 'COMPLETED' || rideStatus === 'COMPLETED';

  if (isWalletPrepaidMethod(method) && status === 'REFUNDED') {
    return REGULAR_RIDE_PAYMENT_LABELS.walletRefundCompleted;
  }
  if (isWalletPrepaidMethod(method) && status === 'PAID' && completed) {
    return REGULAR_RIDE_PAYMENT_LABELS.alreadyPaid;
  }
  return formatPaymentStatusDisplayLabel(status);
};

export const isWalletAccessForbiddenMessage = (message: string | null | undefined): boolean => {
  const text = String(message ?? '').toLowerCase();
  if (!text) {
    return false;
  }
  return (
    text.includes('wallet') &&
    (text.includes('suspend') ||
      text.includes('lock') ||
      text.includes('frozen') ||
      text.includes('block') ||
      text.includes('disabled'))
  );
};

export type RegularBookingIdempotencyScope = {
  key: string;
  rideId: string;
  seats: number;
  paymentMethod: string;
  farePayment: string | null;
};

export const reuseOrCreateIdempotencyKey = (
  current: RegularBookingIdempotencyScope | null,
  next: Omit<RegularBookingIdempotencyScope, 'key'>,
  createKey: () => string,
): RegularBookingIdempotencyScope => {
  if (
    current &&
    current.rideId === next.rideId &&
    current.seats === next.seats &&
    current.paymentMethod === next.paymentMethod &&
    current.farePayment === next.farePayment
  ) {
    return current;
  }
  return { ...next, key: createKey() };
};
