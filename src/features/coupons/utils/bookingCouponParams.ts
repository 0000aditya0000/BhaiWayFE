import type { CouponChargeScope } from '../api/coupons.types';
import { resolveApplyChargeScope } from './couponFare.utils';

export interface AppliedCouponParams {
  couponCode: string;
  couponChargeScope: Exclude<CouponChargeScope, 'BOTH'>;
  /** Server preview discount points — display only; booking ignores this. */
  couponDiscount?: string;
}

export const buildAppliedCouponParams = (input: {
  code?: string | null;
  chargeScope?: CouponChargeScope | string | null;
  rideType: 'regular' | 'assured' | 'commute' | string;
  discountAmount?: string | number | null;
}): AppliedCouponParams | null => {
  const code = String(input.code ?? '')
    .trim()
    .toUpperCase();
  if (!code) {
    return null;
  }
  const couponChargeScope = resolveApplyChargeScope({
    rideType: input.rideType,
    couponChargeScope: input.chargeScope,
  });
  const discount =
    input.discountAmount == null || input.discountAmount === ''
      ? undefined
      : String(Math.max(0, Math.round(Number(input.discountAmount))));
  return {
    couponCode: code,
    couponChargeScope,
    couponDiscount: discount && Number.isFinite(Number(discount)) ? discount : undefined,
  };
};

/** Attach optional coupon fields to a CreateBookingDto-shaped object. */
export const withCouponOnCreateBooking = <T extends object>(
  payload: T,
  applied: AppliedCouponParams | null | undefined,
): T & {
  couponCode?: string;
  couponChargeScope?: Exclude<CouponChargeScope, 'BOTH'>;
} => {
  if (!applied?.couponCode) {
    return payload;
  }
  return {
    ...payload,
    couponCode: applied.couponCode,
    couponChargeScope: applied.couponChargeScope,
  };
};
