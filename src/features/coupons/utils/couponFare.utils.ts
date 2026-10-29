import type { CouponChargeScope } from '../api/coupons.types';
import { defaultCouponChargeScope } from './coupons.mapper';

/**
 * BOTH is never sent at booking apply-time — pick one charge based on ride type.
 */
export const resolveApplyChargeScope = (input: {
  rideType: 'regular' | 'assured' | 'commute' | string;
  couponChargeScope?: CouponChargeScope | string | null;
}): Exclude<CouponChargeScope, 'BOTH'> => {
  const scope = String(input.couponChargeScope ?? '')
    .trim()
    .toUpperCase();
  if (scope === 'ASSURED_SECURITY_DEPOSIT') {
    return 'ASSURED_SECURITY_DEPOSIT';
  }
  if (scope === 'RIDE_FARE') {
    return 'RIDE_FARE';
  }
  // BOTH or unknown → infer from ride mode (matches CreateBookingDto docs).
  return defaultCouponChargeScope(input.rideType);
};

export interface FareWithCouponInput {
  rideFare: number;
  platformFee: number;
  assuredFee: number;
  /** Server-authoritative discount points from preview/validate. */
  discountAmount: number;
  chargeScope: CouponChargeScope | string;
}

export interface FareWithCouponResult {
  rideFare: number;
  platformFee: number;
  /** Security deposit after deposit-scoped discount (never below 0). */
  assuredFee: number;
  promoDiscount: number;
  total: number;
}

/**
 * Build display fare from base charges + server discount.
 * Discount is never invented here — only applied once to the scoped charge.
 */
export const applyCouponDiscountToFare = (
  input: FareWithCouponInput,
): FareWithCouponResult => {
  const rideFare = Math.max(0, Math.round(input.rideFare));
  const platformFee = Math.max(0, Math.round(input.platformFee));
  const baseAssured = Math.max(0, Math.round(input.assuredFee));
  const discount = Math.max(0, Math.round(input.discountAmount));
  const scope = String(input.chargeScope ?? '')
    .trim()
    .toUpperCase();

  if (scope === 'ASSURED_SECURITY_DEPOSIT') {
    const assuredFee = Math.max(0, baseAssured - discount);
    return {
      rideFare,
      platformFee,
      assuredFee,
      promoDiscount: discount,
      // Deposit reduction is already in assuredFee — do not subtract again.
      total: rideFare + platformFee + assuredFee,
    };
  }

  // RIDE_FARE (and BOTH preview displayed as ride-fare reduction for totals).
  const promoDiscount = discount;
  return {
    rideFare,
    platformFee,
    assuredFee: baseAssured,
    promoDiscount,
    total: Math.max(0, rideFare + platformFee + baseAssured - promoDiscount),
  };
};
