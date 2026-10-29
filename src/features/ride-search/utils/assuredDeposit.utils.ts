import { compareCoinStrings, parseIntegerCoinString } from '@/features/profile/utils/walletCoin';

import type { AssuredDepositPenaltyDto } from '@/features/auth/types';

import type { ApiAssuredFarePayment } from '../api/bookings.types';
import type { RideSearchItemDto } from '../api/ridesSearch.types';

/** Maps UI ride tab to backend search rideType. */
export const mapRideTypeTabToApiRideType = (
  tab: 'regular' | 'assured',
): 'REGULAR' | 'ASSURED' => (tab === 'assured' ? 'ASSURED' : 'REGULAR');

export type AssuredFarePaymentChoice = ApiAssuredFarePayment;

/** Backend reason when deposit % is elevated after an Assured passenger cancellation. */
export const PREVIOUS_ASSURED_CANCELLATION = 'PREVIOUS_ASSURED_CANCELLATION';

/** Normal Assured rider deposit percentage when no penalty applies. */
export const DEFAULT_ASSURED_DEPOSIT_PERCENTAGE = 5;

export type AssuredDepositPenaltyNotice = {
  showPreviousCancellationNotice: boolean;
  percentage: number | null;
};

/**
 * Parse backend money / coin inputs into integer coin strings (1 Coin = ₹1).
 * Accepts: 100, "100", "100.00", "5.0" — never treats valid decimals as missing.
 * Uses HALF-UP via Math.round to match backend Point rounding for whole-rupee coins.
 */
export const parseAssuredCoinInput = (
  value: string | number | null | undefined,
): string | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }
    return String(Math.round(value));
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const asInteger = parseIntegerCoinString(trimmed);
  if (asInteger !== null) {
    return asInteger;
  }

  // Decimal / numeric strings from Decimal serializers ("100.00", "5.0").
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }
  return String(Math.round(numeric));
};

/**
 * Parse deposit percentage from backend (number or numeric string).
 * Distinguishes missing/invalid from a real 0 — callers decide whether 0 is usable.
 */
export const parseAssuredPercentageInput = (
  value: string | number | null | undefined,
): number | null => {
  if (value == null || value === '') {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }
  return numeric;
};

/** Add two integer coin strings (BigInt-safe). */
export const addCoinStrings = (
  left: string | null | undefined,
  right: string | null | undefined,
): string => {
  const a = parseIntegerCoinString(left) ?? '0';
  const b = parseIntegerCoinString(right) ?? '0';
  return (BigInt(a) + BigInt(b)).toString();
};

/**
 * Wallet coins required before POST /bookings for Assured.
 * PAY_LATER → deposit only (hold).
 * PAY_NOW → deposit hold + fare debit (atomic on backend).
 */
export const resolveAssuredRequiredCoins = (params: {
  depositCoins: string | null | undefined;
  fareCoins: string | null | undefined;
  farePayment: AssuredFarePaymentChoice;
}): string | null => {
  const deposit = parseIntegerCoinString(params.depositCoins ?? null);
  if (params.farePayment === 'PAY_NOW') {
    const fare = parseIntegerCoinString(params.fareCoins ?? null) ?? '0';
    if (!deposit && fare === '0') {
      return null;
    }
    return addCoinStrings(deposit ?? '0', fare);
  }
  return deposit;
};

export type AssuredDepositRideFields = {
  pricePerSeat?: string | number | null;
  securityDepositAmount?: string | number | null;
  securityDepositPercentage?: string | number | null;
  securityDepositReason?: string | null;
  /** Ride-entity alias used on some public/search payloads (driver DTO naming). */
  assuredDepositAmount?: string | number | null;
  assuredDepositPercentage?: string | number | null;
};

/**
 * Prefer passenger contract fields; fall back to ride-entity Assured aliases.
 * Does not invent values — only reads what the backend already sent.
 */
export const resolveAssuredDepositFieldsFromRide = (
  ride: AssuredDepositRideFields,
): {
  pricePerSeat: string | number | null | undefined;
  securityDepositAmount: string | number | null | undefined;
  securityDepositPercentage: string | number | null | undefined;
} => ({
  pricePerSeat: ride.pricePerSeat,
  securityDepositAmount:
    ride.securityDepositAmount ?? ride.assuredDepositAmount ?? null,
  securityDepositPercentage:
    ride.securityDepositPercentage ?? ride.assuredDepositPercentage ?? null,
});

const normalizeAssuredDepositReason = (value: unknown): string | null => {
  const trimmed = String(value ?? '').trim().toUpperCase();
  return trimmed || null;
};

/**
 * Whether to show the previous-cancellation elevated deposit notice.
 * Requires explicit PREVIOUS_ASSURED_CANCELLATION from ride or /users/me,
 * and a backend deposit percentage above the normal 5%.
 */
export const resolveAssuredDepositPenaltyNotice = (params: {
  ride?: AssuredDepositRideFields | null;
  userPenalty?: AssuredDepositPenaltyDto | null;
  depositPercentage?: number | null;
}): AssuredDepositPenaltyNotice => {
  const rideFields = params.ride ? resolveAssuredDepositFieldsFromRide(params.ride) : null;
  const rideReason = normalizeAssuredDepositReason(params.ride?.securityDepositReason);
  const userReason = normalizeAssuredDepositReason(params.userPenalty?.reason);

  const ridePct = parseAssuredPercentageInput(rideFields?.securityDepositPercentage);
  const userPct = parseAssuredPercentageInput(params.userPenalty?.percentage);
  const pct =
    params.depositPercentage ??
    ridePct ??
    (userPct != null && userPct > 0 ? userPct : null);

  const reasonMatches =
    rideReason === PREVIOUS_ASSURED_CANCELLATION ||
    userReason === PREVIOUS_ASSURED_CANCELLATION;

  const showPreviousCancellationNotice =
    reasonMatches &&
    pct != null &&
    pct > DEFAULT_ASSURED_DEPOSIT_PERCENTAGE;

  return {
    showPreviousCancellationNotice,
    percentage: showPreviousCancellationNotice ? pct : null,
  };
};

export const formatAssuredPreviousCancellationPenaltyMessage = (
  percentage: number,
): string =>
  `Your security deposit is ${Math.round(percentage)}% for this ride because you cancelled your previous Assured ride.`;

/**
 * Resolves the Assured rider security deposit in integer coin strings (1 Coin = ₹1).
 *
 * 1. If securityDepositAmount is present and > 0 → use it.
 * 2. Else if securityDepositPercentage > 0 → fare × percentage / 100
 *    where fare = pricePerSeat × seats.
 * 3. Never silently drop a valid percentage to null because price was "100.00".
 *
 * Rounding: existing project convention — Math.round(percentage), then integer
 * BigInt division for (fare × pct) / 100.
 */
export const computeAssuredRiderDepositCoins = (params: {
  pricePerSeat: string | number;
  seats: number;
  securityDepositAmount?: string | number | null;
  securityDepositPercentage?: string | number | null;
}): string | null => {
  const pricePerSeat = parseAssuredCoinInput(params.pricePerSeat);
  const pct = parseAssuredPercentageInput(params.securityDepositPercentage);
  const seats = Math.max(1, Math.floor(params.seats));

  let fromPercentage: string | null = null;
  if (pricePerSeat != null && pricePerSeat !== '0' && pct != null && pct > 0) {
    const totalFare = BigInt(pricePerSeat) * BigInt(seats);
    // Valid percentage + positive fare must not collapse to a hidden null.
    fromPercentage = ((totalFare * BigInt(Math.round(pct))) / BigInt(100)).toString();
  }

  const direct = parseAssuredCoinInput(params.securityDepositAmount);
  if (direct !== null && direct !== '0') {
    /**
     * Ride-level securityDepositAmount is sometimes snapshotted for the
     * vehicle's full seat capacity (e.g. ₹15 for 3 seats at 5% of ₹100),
     * while booking holds deposit for the selected seats (₹5 for 1 seat).
     * When amount is an exact multiple of the selected-seat percentage calc
     * and larger, prefer the selected-seat calculation.
     */
    if (fromPercentage && fromPercentage !== '0' && direct !== fromPercentage) {
      try {
        const directCoins = BigInt(direct);
        const expectedCoins = BigInt(fromPercentage);
        if (
          expectedCoins > 0n &&
          directCoins > expectedCoins &&
          directCoins % expectedCoins === 0n
        ) {
          return fromPercentage;
        }
      } catch {
        // Fall through to explicit amount.
      }
    }
    return direct;
  }

  return fromPercentage;
};

export const computeAssuredDepositFromRide = (
  ride: AssuredDepositRideFields &
    Pick<RideSearchItemDto, 'pricePerSeat'> &
    Partial<
      Pick<
        RideSearchItemDto,
        'securityDepositAmount' | 'securityDepositPercentage'
      >
    >,
  seats: number,
): string | null => {
  const fields = resolveAssuredDepositFieldsFromRide(ride);
  if (fields.pricePerSeat == null || fields.pricePerSeat === '') {
    return null;
  }
  return computeAssuredRiderDepositCoins({
    pricePerSeat: fields.pricePerSeat,
    seats,
    securityDepositAmount: fields.securityDepositAmount,
    securityDepositPercentage: fields.securityDepositPercentage,
  });
};

/** Display helper — percentage snapshotted on the public/search ride when present. */
export const resolveAssuredDepositPercentageFromRide = (
  ride: AssuredDepositRideFields,
): number | null => {
  const pct = parseAssuredPercentageInput(
    resolveAssuredDepositFieldsFromRide(ride).securityDepositPercentage,
  );
  return pct != null && pct > 0 ? pct : null;
};

/**
 * Assured passenger bookability from GET /rides/public/:id (or search item).
 * Does NOT require PUBLISHED. ASSURANCE_PENDING / zero seats → not bookable.
 */
export const isAssuredPublicRideBookable = (
  ride: Pick<RideSearchItemDto, 'rideType' | 'availableSeats' | 'status' | 'isBookable'>,
): boolean => {
  if (String(ride.rideType ?? '').trim().toUpperCase() !== 'ASSURED') {
    return false;
  }
  const status = String(ride.status ?? '')
    .trim()
    .toUpperCase();
  if (status === 'ASSURANCE_PENDING') {
    return false;
  }
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return false;
  }
  if (ride.isBookable === false) {
    return false;
  }
  return Number(ride.availableSeats) > 0;
};

/** UX pre-check only — backend remains authoritative on POST /bookings. */
export const isInsufficientWalletForAssuredDeposit = (
  availableCoins: string | null | undefined,
  requiredDepositCoins: string | null | undefined,
): boolean => {
  const required = parseIntegerCoinString(requiredDepositCoins ?? null);
  if (!required || required === '0') {
    return false;
  }
  const available = parseIntegerCoinString(availableCoins ?? null) ?? '0';
  return compareCoinStrings(available, required) < 0;
};

export const generateAssuredBookingIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `booking-${time}-${random}`;
};
