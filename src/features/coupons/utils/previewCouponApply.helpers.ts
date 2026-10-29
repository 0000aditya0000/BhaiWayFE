import type { CouponChargeScope, CouponDto } from '../api/coupons.types';
import { resolveApplyChargeScope } from './couponFare.utils';
import { defaultCouponChargeScope, toCouponRideType } from './coupons.mapper';

export type BookingRideType = 'regular' | 'assured' | 'commute';

/**
 * Candidate apply-time scopes for a booking.
 * Never sends BOTH — backend rejects BOTH at apply/preview.
 */
export const candidateChargeScopes = (input: {
  rideType: BookingRideType | string;
  couponChargeScope?: CouponChargeScope | string | null;
}): Array<Exclude<CouponChargeScope, 'BOTH'>> => {
  const rideKey = String(input.rideType ?? '')
    .trim()
    .toLowerCase();
  const raw = String(input.couponChargeScope ?? '')
    .trim()
    .toUpperCase();

  if (raw === 'RIDE_FARE') {
    return ['RIDE_FARE'];
  }
  if (raw === 'ASSURED_SECURITY_DEPOSIT') {
    return rideKey === 'assured' ? ['ASSURED_SECURITY_DEPOSIT'] : ['RIDE_FARE'];
  }

  if (rideKey === 'assured') {
    return ['ASSURED_SECURITY_DEPOSIT', 'RIDE_FARE'];
  }
  return ['RIDE_FARE'];
};

export const couponMatchesRideType = (
  coupon: CouponDto,
  rideType: BookingRideType | string,
): boolean => {
  const scope = String(coupon.rideTypeScope ?? 'ALL')
    .trim()
    .toUpperCase();
  if (!scope || scope === 'ALL') {
    return true;
  }
  const expected = toCouponRideType(rideType);
  return scope === expected;
};

export const couponChargeCompatibleWithRide = (
  coupon: CouponDto,
  rideType: BookingRideType | string,
): boolean => {
  const rideKey = String(rideType ?? '')
    .trim()
    .toLowerCase();
  const scope = String(coupon.chargeScope ?? '')
    .trim()
    .toUpperCase();
  if (rideKey !== 'assured' && scope === 'ASSURED_SECURITY_DEPOSIT') {
    return false;
  }
  return true;
};

export const resolveListedCouponPreferredScope = (
  rideType: BookingRideType | string,
  listed?: CouponDto | null,
): Exclude<CouponChargeScope, 'BOTH'> => {
  if (listed?.chargeScope) {
    return resolveApplyChargeScope({
      rideType,
      couponChargeScope: listed.chargeScope,
    });
  }
  return defaultCouponChargeScope(rideType);
};

export const isChargeScopeMismatch = (message: string): boolean => {
  const lower = message.toLowerCase();
  return (
    lower.includes('charge type') ||
    lower.includes('charge scope') ||
    lower.includes('not valid for this charge') ||
    lower.includes('assured_security_deposit') ||
    lower.includes('ride_fare')
  );
};
