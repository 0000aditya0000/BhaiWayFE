import { previewCoupon } from '../api/coupons.api';
import type {
  CouponChargeScope,
  CouponDto,
  CouponPreviewResultDto,
} from '../api/coupons.types';
import { resolveApplyChargeScope } from './couponFare.utils';
import {
  couponErrorUserMessage,
  isCouponAudienceMismatchError,
} from './couponErrors';
import {
  resolveCouponEligibleAmount,
  toCouponRideType,
} from './coupons.mapper';
import {
  candidateChargeScopes,
  isChargeScopeMismatch,
  type BookingRideType,
} from './previewCouponApply.helpers';

export type { BookingRideType } from './previewCouponApply.helpers';
export {
  candidateChargeScopes,
  couponChargeCompatibleWithRide,
  couponMatchesRideType,
  resolveListedCouponPreferredScope,
} from './previewCouponApply.helpers';

export interface AppliedCouponPreview {
  code: string;
  chargeScope: Exclude<CouponChargeScope, 'BOTH'>;
  discountAmount: number;
  amountAfterDiscount: number | null;
  originalAmount: number | null;
  title: string | null;
  benefitType: string | null;
  pointsCredit: number | null;
  message: string | null;
}

export type PreviewCouponApplyResult =
  | { ok: true; applied: AppliedCouponPreview }
  | { ok: false; message: string };

const toApplied = (
  preview: CouponPreviewResultDto,
  preferredScope: Exclude<CouponChargeScope, 'BOTH'>,
  rideType: BookingRideType | string,
): AppliedCouponPreview => {
  const discount = Math.max(0, Math.round(Number(preview.discountAmount ?? 0)));
  const pointsCredit =
    preview.pointsCredit != null && preview.pointsCredit !== ''
      ? Math.max(0, Math.round(Number(preview.pointsCredit)))
      : null;
  const amountAfter =
    preview.amountAfterDiscount != null && preview.amountAfterDiscount !== ''
      ? Math.max(0, Math.round(Number(preview.amountAfterDiscount)))
      : null;
  const original =
    preview.originalAmount != null && preview.originalAmount !== ''
      ? Math.max(0, Math.round(Number(preview.originalAmount)))
      : null;

  return {
    code: preview.code,
    chargeScope: resolveApplyChargeScope({
      rideType,
      couponChargeScope: preview.chargeScope ?? preferredScope,
    }),
    discountAmount: discount,
    amountAfterDiscount: Number.isFinite(amountAfter as number) ? amountAfter : null,
    originalAmount: Number.isFinite(original as number) ? original : null,
    title: preview.title,
    benefitType: preview.benefitType,
    pointsCredit: Number.isFinite(pointsCredit as number) ? pointsCredit : null,
    message: preview.message,
  };
};

/**
 * Authoritative coupon preview against the current booking amounts.
 * Tries compatible charge scopes when the catalog scope is BOTH/unknown.
 */
export const previewCouponForBooking = async (input: {
  code: string;
  rideType: BookingRideType | string;
  rideFare: number;
  assuredFee: number;
  listedCoupon?: CouponDto | null;
  requestId?: number;
  isCurrent?: (requestId: number) => boolean;
}): Promise<PreviewCouponApplyResult> => {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    return { ok: false, message: 'Please enter a promo code.' };
  }
  if (code.length < 3) {
    return { ok: false, message: 'Enter a valid promo code.' };
  }

  const scopes = candidateChargeScopes({
    rideType: input.rideType,
    couponChargeScope: input.listedCoupon?.chargeScope,
  });
  const rideTypeScope = toCouponRideType(input.rideType);

  let lastMessage = 'This coupon is invalid, expired, or not eligible for this ride.';

  for (let index = 0; index < scopes.length; index += 1) {
    const scope = scopes[index]!;
    if (
      input.requestId != null &&
      input.isCurrent &&
      !input.isCurrent(input.requestId)
    ) {
      return { ok: false, message: 'Cancelled' };
    }

    const amount = resolveCouponEligibleAmount({
      chargeScope: scope,
      rideFare: input.rideFare,
      assuredFee: input.assuredFee,
    });

    try {
      const preview = await previewCoupon({
        code,
        rideType: rideTypeScope,
        chargeScope: scope,
        amount,
      });

      if (
        input.requestId != null &&
        input.isCurrent &&
        !input.isCurrent(input.requestId)
      ) {
        return { ok: false, message: 'Cancelled' };
      }

      if (!preview.valid) {
        lastMessage =
          preview.message ||
          'This coupon is invalid, expired, or not eligible for this ride.';
        if (isCouponAudienceMismatchError(preview.raw ?? preview, lastMessage)) {
          return { ok: false, message: lastMessage };
        }
        if (isChargeScopeMismatch(lastMessage) && index < scopes.length - 1) {
          continue;
        }
        return { ok: false, message: lastMessage };
      }

      const applied = toApplied(preview, scope, input.rideType);
      const benefit = String(applied.benefitType ?? '').toUpperCase();

      if (benefit === 'POINTS_CREDIT') {
        return { ok: true, applied };
      }

      if (applied.discountAmount <= 0) {
        lastMessage =
          preview.message ||
          'This coupon did not produce a discount for the current fare.';
        if (index < scopes.length - 1) {
          continue;
        }
        return { ok: false, message: lastMessage };
      }

      return { ok: true, applied };
    } catch (error) {
      const message = couponErrorUserMessage(error, 'Could not validate this coupon.');
      lastMessage = message;
      if (isCouponAudienceMismatchError(error, message)) {
        return { ok: false, message: lastMessage };
      }
      if (isChargeScopeMismatch(message) && index < scopes.length - 1) {
        continue;
      }
      return { ok: false, message: lastMessage };
    }
  }

  return { ok: false, message: lastMessage };
};
