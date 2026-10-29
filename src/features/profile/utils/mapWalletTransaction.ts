/** Maps backend wallet transaction types to user-facing labels and visuals. */

import type { WalletTransactionDto } from '../api/wallet.types';

const RIDE_BOOKING_TRANSACTION_TYPES = new Set([
  'BOOKING_PAYMENT',
  'BOOKING',
  'RIDE_BOOKING',
]);

export type WalletDisplayCategory =
  | 'TOP_UP'
  | 'BOOKING'
  | 'EARNING'
  | 'REFUND'
  | 'DEPOSIT'
  | 'BONUS'
  | 'CANCELLATION'
  | 'COMPENSATION'
  | 'WITHDRAWAL'
  | 'PENALTY'
  | 'ADJUSTMENT'
  | 'OTHER'
  | string;

export type WalletTransactionIcon = 'car' | 'card' | 'business' | 'star';

export type WalletTransactionIconTone = 'credit' | 'debit' | 'primary' | 'neutral';

export interface WalletTransactionRideContext {
  rideId: string;
  rideTypeLabel: 'Assured' | 'Regular' | 'Office Commute';
}

export interface WalletTransactionDisplay {
  title: string;
  subtitle?: string;
}

export interface WalletTransactionVisual {
  icon: WalletTransactionIcon;
  iconTone: WalletTransactionIconTone;
}

const asTrimmed = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const normalizeRideTypeKey = (value: string | null | undefined): string =>
  asTrimmed(value).toUpperCase();

const normalizeRideTypeLabel = (
  value: string | null | undefined,
): WalletTransactionRideContext['rideTypeLabel'] | null => {
  const key = normalizeRideTypeKey(value);
  if (key === 'ASSURED') {
    return 'Assured';
  }
  if (key === 'REGULAR') {
    return 'Regular';
  }
  if (key === 'COMMUTE') {
    return 'Office Commute';
  }
  return null;
};

const formatRideIdForDisplay = (rideId: string): string => {
  const trimmed = rideId.trim();
  if (trimmed.length <= 12) {
    return trimmed;
  }
  return `${trimmed.slice(0, 8)}…`;
};

const isTopUpPurchase = (dto: WalletTransactionDto): boolean => {
  const category = normalizeRideTypeKey(dto.displayCategory);
  if (category === 'TOP_UP') {
    return true;
  }
  const referenceType = asTrimmed(dto.referenceType).toUpperCase();
  return (
    referenceType === 'TOP_UP_ORDER' ||
    referenceType === 'PAYMENT_ORDER' ||
    referenceType === 'TOP_UP'
  );
};

/** True when backend marks this row as a ride booking debit/credit. */
export const isRideBookingTransaction = (dto: WalletTransactionDto): boolean => {
  const type = asTrimmed(dto.transactionType).toUpperCase();
  if (RIDE_BOOKING_TRANSACTION_TYPES.has(type)) {
    return true;
  }
  return asTrimmed(dto.referenceType).toUpperCase() === 'BOOKING';
};

/**
 * Reads rideId + rideType only from API fields — never invents values.
 * Returns null unless both are present.
 */
export const extractWalletTransactionRideContext = (
  dto: WalletTransactionDto,
): WalletTransactionRideContext | null => {
  const rideId =
    asTrimmed(dto.rideId) ||
    (asTrimmed(dto.referenceType).toUpperCase() === 'RIDE'
      ? asTrimmed(dto.referenceId)
      : '');

  const rideTypeLabel = normalizeRideTypeLabel(dto.rideType);

  if (!rideId || !rideTypeLabel) {
    return null;
  }

  return { rideId, rideTypeLabel };
};

export const formatRideBookingSubtitle = (
  context: WalletTransactionRideContext,
): string =>
  `Ride ID ${formatRideIdForDisplay(context.rideId)} · ${context.rideTypeLabel}`;

const resolveBookingPaymentTitle = (rideType: string): string => {
  if (rideType === 'COMMUTE') {
    return 'Office commute booked';
  }
  if (rideType === 'ASSURED') {
    return 'Assured ride fare paid';
  }
  return 'Ride fare paid';
};

const resolveDriverEarningTitle = (rideType: string): string => {
  if (rideType === 'COMMUTE') {
    return 'Office commute earnings';
  }
  if (rideType === 'ASSURED') {
    return 'Assured ride earnings';
  }
  if (rideType === 'REGULAR') {
    return 'Regular ride earnings';
  }
  return 'Ride earnings';
};

const resolveRefundTitle = (dto: WalletTransactionDto): string => {
  const category = normalizeRideTypeKey(dto.displayCategory);
  if (category === 'CANCELLATION') {
    return 'Ride cancellation refund';
  }

  const title = asTrimmed(dto.displayTitle).toLowerCase();
  if (title.includes('rejected')) {
    return 'Booking request rejected — refund';
  }
  if (title.includes('ride full') || title.includes('full')) {
    return 'Ride full — booking refund';
  }
  if (title.includes('ride cancelled') || title.includes('cancelled')) {
    return 'Ride cancelled — refund';
  }
  if (normalizeRideTypeKey(dto.rideType) === 'ASSURED') {
    return 'Assured ride fare refund';
  }
  return 'Refund';
};

/**
 * Backend-authoritative title when present; otherwise maps transactionType + rideType.
 */
export const resolveWalletTransactionTitle = (dto: WalletTransactionDto): string => {
  const displayTitle = asTrimmed(dto.displayTitle);
  if (displayTitle) {
    return displayTitle;
  }

  const type = asTrimmed(dto.transactionType).toUpperCase();
  const rideType = normalizeRideTypeKey(dto.rideType);

  if (type === 'POINT_PURCHASE' || type === 'TOP_UP' || type === 'WALLET_TOP_UP') {
    return isTopUpPurchase(dto) ? 'Coins purchased' : 'Wallet top-up';
  }

  if (type === 'PROMOTIONAL_CREDIT') {
    const referenceType = asTrimmed(dto.referenceType).toUpperCase();
    if (referenceType === 'REFERRAL') {
      return 'Referral Reward';
    }
    return 'Bonus coins added';
  }

  if (type === 'BOOKING_PAYMENT') {
    return resolveBookingPaymentTitle(rideType);
  }

  if (type === 'DRIVER_EARNING') {
    return resolveDriverEarningTitle(rideType);
  }

  if (type === 'ASSURED_DEPOSIT_HOLD') {
    return 'Assured security deposit held';
  }

  if (type === 'HOLD_RELEASE') {
    return 'Assured security deposit released';
  }

  if (type === 'HOLD_CONSUMED') {
    return 'Assured security deposit used';
  }

  if (type === 'REFUND') {
    return resolveRefundTitle(dto);
  }

  if (type === 'ASSURED_RIDER_COMPENSATION') {
    return 'Ride cancellation compensation';
  }

  if (type === 'WITHDRAWAL') {
    return 'Withdrawal';
  }

  if (type === 'NO_SHOW_FORFEITURE') {
    return 'No-show penalty';
  }

  return mapTransactionTypeLabel(dto.transactionType);
};

export const mapWalletTransactionDisplay = (
  dto: WalletTransactionDto,
): WalletTransactionDisplay => {
  const title = resolveWalletTransactionTitle(dto);

  if (asTrimmed(dto.displayTitle)) {
    return { title };
  }

  const rideContext = extractWalletTransactionRideContext(dto);
  if (rideContext && isRideBookingTransaction(dto)) {
    return {
      title,
      subtitle: formatRideBookingSubtitle(rideContext),
    };
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__ && isRideBookingTransaction(dto)) {
    console.log('[Wallet] booking transaction missing rideId and/or rideType from API', {
      transactionId: dto.transactionId,
      transactionType: dto.transactionType,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      rideId: dto.rideId ?? null,
      rideType: dto.rideType ?? null,
    });
  }

  return { title };
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  POINT_PURCHASE: 'Coins purchased',
  TOP_UP: 'Wallet top-up',
  WALLET_TOP_UP: 'Wallet top-up',
  PURCHASE: 'Coins purchased',
  BOOKING_PAYMENT: 'Ride fare paid',
  BOOKING_PAYMENT_DEBIT: 'Ride fare paid',
  BOOKING_FARE: 'Ride fare paid',
  BOOKING_FARE_PAYMENT: 'Ride fare paid',
  RIDE_BOOKING_PAYMENT: 'Ride fare paid',
  WALLET_DEBIT: 'Ride fare paid',
  PAYMENT: 'Ride fare paid',
  RIDE_PAYMENT: 'Ride fare paid',
  RIDE_FARE: 'Ride fare paid',
  FARE_PAYMENT: 'Ride fare paid',
  DEBIT: 'Ride fare paid',
  DRIVER_EARNING: 'Ride earnings',
  DRIVER_EARNINGS: 'Ride earnings',
  EARNING: 'Ride earnings',
  REFUND: 'Refund',
  PROMOTIONAL_CREDIT: 'Bonus coins added',
  PROMOTIONAL: 'Bonus coins added',
  HOLD: 'Coins held',
  HOLD_RELEASE: 'Assured security deposit released',
  HOLD_CONSUMED: 'Assured security deposit used',
  DEPOSIT_HOLD: 'Assured security deposit held',
  DEPOSIT_RELEASE: 'Assured security deposit released',
  ASSURED_DEPOSIT: 'Assured security deposit held',
  ASSURED_DEPOSIT_HOLD: 'Assured security deposit held',
  ASSURED_RIDER_COMPENSATION: 'Ride cancellation compensation',
  CANCELLATION: 'Ride cancellation refund',
  PARTIAL_FILL_COMPENSATION: 'Ride cancellation compensation',
  WITHDRAWAL: 'Withdrawal',
  NO_SHOW_FORFEITURE: 'No-show penalty',
};

export const mapTransactionTypeLabel = (transactionType: string | null | undefined): string => {
  const key = String(transactionType ?? '').trim().toUpperCase();
  if (!key) {
    return 'Wallet transaction';
  }
  return TRANSACTION_TYPE_LABELS[key] ?? 'Wallet transaction';
};

export const mapPointSourceLabel = (pointSource: string | null | undefined): string | null => {
  const key = String(pointSource ?? '').trim().toUpperCase();
  if (key === 'PURCHASED') {
    return 'Purchased';
  }
  if (key === 'PROMOTIONAL') {
    return 'Promotional';
  }
  if (key === 'DRIVER_EARNED') {
    return 'Driver earned';
  }
  return null;
};

export const mapTransactionCategoryIcon = (
  category: string | null | undefined,
  transactionType: string,
  direction: string,
): WalletTransactionIcon => {
  switch (normalizeRideTypeKey(category)) {
    case 'TOP_UP':
      return 'card';
    case 'BOOKING':
      return 'car';
    case 'EARNING':
      return 'star';
    case 'REFUND':
    case 'CANCELLATION':
      return 'card';
    case 'DEPOSIT':
      return 'business';
    case 'BONUS':
      return 'star';
    case 'COMPENSATION':
      return 'star';
    case 'WITHDRAWAL':
      return 'business';
    case 'PENALTY':
      return 'business';
    case 'ADJUSTMENT':
      return 'business';
    default:
      return mapTransactionIcon(transactionType, direction);
  }
};

export const mapTransactionCategoryIconTone = (
  category: string | null | undefined,
  direction: string,
): WalletTransactionIconTone => {
  switch (normalizeRideTypeKey(category)) {
    case 'TOP_UP':
    case 'BONUS':
      return 'primary';
    case 'EARNING':
    case 'REFUND':
    case 'COMPENSATION':
      return 'credit';
    case 'BOOKING':
      return 'primary';
    case 'PENALTY':
      return 'debit';
    case 'DEPOSIT':
    case 'ADJUSTMENT':
    case 'OTHER':
      return 'primary';
    case 'WITHDRAWAL':
      return mapTransactionDirectionType(direction) === 'credit' ? 'credit' : 'debit';
    case 'CANCELLATION':
      return 'credit';
    default:
      return mapTransactionDirectionType(direction) === 'credit' ? 'credit' : 'debit';
  }
};

export const mapWalletTransactionVisual = (
  dto: Pick<WalletTransactionDto, 'displayCategory' | 'transactionType' | 'direction'>,
): WalletTransactionVisual => ({
  icon: mapTransactionCategoryIcon(
    dto.displayCategory,
    dto.transactionType,
    dto.direction,
  ),
  iconTone: mapTransactionCategoryIconTone(dto.displayCategory, dto.direction),
});

export const mapTransactionIcon = (
  transactionType: string,
  direction: string,
): WalletTransactionIcon => {
  const type = transactionType.toUpperCase();
  if (type.includes('EARN') || type.includes('BONUS') || type.includes('PROMO')) {
    return 'star';
  }
  if (type.includes('PURCHASE') || type.includes('TOP_UP') || type.includes('TOPUP')) {
    return 'card';
  }
  if (type.includes('WITHDRAW') || type.includes('HOLD') || type.includes('DEPOSIT')) {
    return 'business';
  }
  if (String(direction).toUpperCase() === 'DEBIT') {
    return 'car';
  }
  return 'card';
};

export const mapTransactionDirectionType = (
  direction: string,
): 'credit' | 'debit' =>
  String(direction).toUpperCase() === 'DEBIT' ? 'debit' : 'credit';

export const formatTransactionDateLabel = (iso: string | null | undefined): string => {
  const trimmed = String(iso ?? '').trim();
  if (!trimmed) {
    return '';
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
