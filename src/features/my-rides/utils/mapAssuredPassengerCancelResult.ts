import type { AssuredPassengerCancelResultDto, CancelBookingResultDto } from '@/features/ride-search/api/bookings.types';
import { parseAssuredCoinInput } from '@/features/ride-search/utils/assuredDeposit.utils';

export interface AssuredPassengerCancelDisplay {
  heading: string;
  lines: string[];
}

const parseCoins = (value: string | number | null | undefined): number | null => {
  const parsed = parseAssuredCoinInput(value);
  if (!parsed) {
    return null;
  }
  const numeric = Number(parsed);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const formatRupee = (value: string | number | null | undefined): string | null => {
  const coins = parseCoins(value);
  if (coins == null) {
    return null;
  }
  return `₹${coins.toLocaleString('en-IN')}`;
};

const normalizeFarePayment = (
  value: string | null | undefined,
): 'PAY_NOW' | 'PAY_LATER' | null => {
  const key = String(value ?? '').trim().toUpperCase();
  if (key === 'PAY_NOW' || key === 'PAY_LATER') {
    return key;
  }
  return null;
};

/**
 * Derives total fare paid from backend split fields only (no 30/70 math).
 * fare = platformAmount + (driverCompensation - securityDepositForfeited)
 */
const resolveFarePaidFromBackend = (result: CancelBookingResultDto): number | null => {
  const explicit = parseCoins(result.fareAmount);
  if (explicit != null) {
    return explicit;
  }

  const platform = parseCoins(result.platformAmount);
  const driver = parseCoins(result.driverCompensation);
  const deposit = parseCoins(result.securityDepositForfeited) ?? 0;
  if (platform == null || driver == null) {
    return null;
  }
  const fare = platform + Math.max(0, driver - deposit);
  return fare > 0 ? fare : null;
};

const buildNextDepositLine = (percentage: number | null | undefined): string | null => {
  if (percentage == null || !Number.isFinite(percentage) || percentage <= 0) {
    return null;
  }
  const rounded = Math.round(percentage);
  return `Your next Assured ride will require a ${rounded}% security deposit. This applies to your next Assured booking only.`;
};

/**
 * Maps Assured passenger cancel API response to passenger-facing copy.
 * All amounts come from backend fields — never computed splits.
 */
export const mapAssuredPassengerCancelDisplay = (
  result: CancelBookingResultDto,
): AssuredPassengerCancelDisplay => {
  const lines: string[] = [];
  const depositLabel = formatRupee(result.securityDepositForfeited);
  if (depositLabel) {
    lines.push(`Your security deposit of ${depositLabel} has been forfeited.`);
  }

  const farePayment = normalizeFarePayment(result.farePayment ?? null);
  const fareRefunded = parseCoins(result.fareRefunded);
  if (fareRefunded != null && fareRefunded > 0) {
    lines.push(`₹${fareRefunded.toLocaleString('en-IN')} fare has been refunded to your wallet.`);
  }

  if (farePayment === 'PAY_NOW') {
    const farePaid = resolveFarePaidFromBackend(result);
    if (farePaid != null) {
      lines.push(
        `Your fare payment of ₹${farePaid.toLocaleString('en-IN')} is non-refundable.`,
      );
    } else {
      lines.push('Your fare payment is non-refundable.');
    }
  }

  const compensationLabel = formatRupee(result.driverCompensation);
  if (compensationLabel) {
    lines.push(`${compensationLabel} has been given to the driver as compensation.`);
  }

  const nextDepositLine = buildNextDepositLine(result.nextAssuredDepositPercentage);
  if (nextDepositLine) {
    lines.push(nextDepositLine);
  }

  return {
    heading: 'Ride Cancelled',
    lines,
  };
};

export const isAssuredPassengerCancelResult = (
  result: CancelBookingResultDto,
): result is AssuredPassengerCancelResultDto => {
  const farePayment = normalizeFarePayment(result.farePayment ?? null);
  return Boolean(
    parseCoins(result.securityDepositForfeited) != null &&
      farePayment &&
      parseCoins(result.driverCompensation) != null,
  );
};
