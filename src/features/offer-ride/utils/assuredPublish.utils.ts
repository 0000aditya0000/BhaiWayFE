import { compareCoinStrings, parseIntegerCoinString } from '@/features/profile/utils/walletCoin';
import { computeAssuredRiderDepositCoins } from '@/features/ride-search/utils/assuredDeposit.utils';

import { ASSURED_DRIVER_DEPOSIT_PERCENT_UX } from '../constants/ride-preferences.constants';
import type { PublishRideDraft } from '../types';
import { isValidApiCoordinatePair, parsePricePerSeat } from './createRide.mapper';

export const generateAssuredPublishIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `publish-${time}-${random}`;
};

/** Assured POST /rides requires WGS84 source/destination coordinates from the draft. */
export const validateAssuredDraftCoordinates = (
  draft: PublishRideDraft,
): { ok: true } | { ok: false; message: string } => {
  const origin = draft.originLocation;
  const destination = draft.destinationLocation;

  if (!isValidApiCoordinatePair(origin?.latitude, origin?.longitude)) {
    return {
      ok: false,
      message: 'Please select a valid pickup location with map coordinates before publishing.',
    };
  }

  if (!isValidApiCoordinatePair(destination?.latitude, destination?.longitude)) {
    return {
      ok: false,
      message: 'Please select a valid drop-off location with map coordinates before publishing.',
    };
  }

  return { ok: true };
};

/**
 * UX-only driver deposit estimate (integer coin string).
 * Backend admin deposit % is authoritative — use for display/pre-check only.
 */
export const computeAssuredDriverDepositCoins = (draft: PublishRideDraft): string | null => {
  const pricePerSeat = parsePricePerSeat(draft.pricePerSeat);
  if (pricePerSeat === null || pricePerSeat <= 0) {
    return null;
  }

  return computeAssuredRiderDepositCoins({
    pricePerSeat: String(pricePerSeat),
    seats: draft.availableSeats,
    securityDepositPercentage: ASSURED_DRIVER_DEPOSIT_PERCENT_UX,
  });
};

/** UX pre-check only — backend POST /rides remains authoritative. */
export const isInsufficientWalletForAssuredPublish = (
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
