import assert from 'node:assert/strict';

import {
  candidateChargeScopes,
  couponChargeCompatibleWithRide,
  couponMatchesRideType,
} from './previewCouponApply.helpers';
import { applyCouponDiscountToFare } from './couponFare.utils';
import type { CouponDto } from '../api/coupons.types';

const baseCoupon = (patch: Partial<CouponDto>): CouponDto => ({
  id: 'c1',
  code: 'SAVE50',
  title: 'Save 50',
  description: null,
  benefitType: 'FIXED_DISCOUNT',
  benefitValue: '50',
  maxDiscountAmount: null,
  minEligibleAmount: null,
  rideTypeScope: 'ALL',
  chargeScope: 'RIDE_FARE',
  audience: null,
  startsAt: null,
  expiresAt: null,
  isActive: true,
  ...patch,
});

assert.deepEqual(candidateChargeScopes({ rideType: 'regular' }), ['RIDE_FARE']);
assert.deepEqual(candidateChargeScopes({ rideType: 'commute' }), ['RIDE_FARE']);
assert.deepEqual(candidateChargeScopes({ rideType: 'assured' }), [
  'ASSURED_SECURITY_DEPOSIT',
  'RIDE_FARE',
]);
assert.deepEqual(
  candidateChargeScopes({ rideType: 'assured', couponChargeScope: 'RIDE_FARE' }),
  ['RIDE_FARE'],
);
assert.deepEqual(
  candidateChargeScopes({
    rideType: 'regular',
    couponChargeScope: 'ASSURED_SECURITY_DEPOSIT',
  }),
  ['RIDE_FARE'],
);

assert.equal(couponMatchesRideType(baseCoupon({ rideTypeScope: 'ALL' }), 'regular'), true);
assert.equal(couponMatchesRideType(baseCoupon({ rideTypeScope: 'REGULAR' }), 'regular'), true);
assert.equal(couponMatchesRideType(baseCoupon({ rideTypeScope: 'ASSURED' }), 'regular'), false);
assert.equal(couponMatchesRideType(baseCoupon({ rideTypeScope: 'OFFICE_COMMUTE' }), 'commute'), true);

assert.equal(
  couponChargeCompatibleWithRide(
    baseCoupon({ chargeScope: 'ASSURED_SECURITY_DEPOSIT' }),
    'regular',
  ),
  false,
);
assert.equal(
  couponChargeCompatibleWithRide(
    baseCoupon({ chargeScope: 'ASSURED_SECURITY_DEPOSIT' }),
    'assured',
  ),
  true,
);

// Fare restore: remove discount → base total
{
  const withDiscount = applyCouponDiscountToFare({
    rideFare: 300,
    platformFee: 0,
    assuredFee: 0,
    discountAmount: 75,
    chargeScope: 'RIDE_FARE',
  });
  assert.equal(withDiscount.total, 225);
  assert.equal(withDiscount.promoDiscount, 75);
  const restored = applyCouponDiscountToFare({
    rideFare: 300,
    platformFee: 0,
    assuredFee: 0,
    discountAmount: 0,
    chargeScope: 'RIDE_FARE',
  });
  assert.equal(restored.total, 300);
  assert.equal(restored.promoDiscount, 0);
}

console.log('previewCouponApply.test.ts: ok');
