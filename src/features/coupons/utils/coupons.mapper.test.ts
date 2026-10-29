import assert from 'node:assert/strict';

import { buildAppliedCouponParams, withCouponOnCreateBooking } from './bookingCouponParams';
import { applyCouponDiscountToFare, resolveApplyChargeScope } from './couponFare.utils';
import { normalizeCouponPreviewResult } from './coupons.mapper';

// --- Preview normalize (backend validate/preview shape) ---
{
  const valid = normalizeCouponPreviewResult(
    {
      valid: true,
      code: 'SAVE50',
      benefitType: 'FIXED_DISCOUNT',
      rideTypeScope: 'REGULAR',
      chargeScope: 'RIDE_FARE',
      originalAmount: '200',
      discountAmount: '50',
      finalAmount: '150',
      pointsCredit: null,
    },
    'SAVE50',
  );
  assert.equal(valid.valid, true);
  assert.equal(valid.code, 'SAVE50');
  assert.equal(valid.discountAmount, '50');
  assert.equal(valid.amountAfterDiscount, '150');
  assert.equal(valid.originalAmount, '200');
  assert.equal(valid.pointsCredit, null);
}

{
  const invalid = normalizeCouponPreviewResult(
    { valid: false, message: 'Coupon expired' },
    'OLD',
  );
  assert.equal(invalid.valid, false);
  assert.equal(invalid.message, 'Coupon expired');
  assert.equal(invalid.discountAmount, null);
}

// --- Fare application (no double discount) ---
{
  const rideFare = applyCouponDiscountToFare({
    rideFare: 200,
    platformFee: 0,
    assuredFee: 0,
    discountAmount: 50,
    chargeScope: 'RIDE_FARE',
  });
  assert.equal(rideFare.promoDiscount, 50);
  assert.equal(rideFare.total, 150);
}

{
  const deposit = applyCouponDiscountToFare({
    rideFare: 200,
    platformFee: 0,
    assuredFee: 100,
    discountAmount: 40,
    chargeScope: 'ASSURED_SECURITY_DEPOSIT',
  });
  assert.equal(deposit.assuredFee, 60);
  assert.equal(deposit.promoDiscount, 40);
  // Discount already reflected in assuredFee — total must not subtract again.
  assert.equal(deposit.total, 260);
}

// --- Apply-time BOTH → single charge ---
assert.equal(
  resolveApplyChargeScope({ rideType: 'assured', couponChargeScope: 'BOTH' }),
  'ASSURED_SECURITY_DEPOSIT',
);
assert.equal(
  resolveApplyChargeScope({ rideType: 'regular', couponChargeScope: 'BOTH' }),
  'RIDE_FARE',
);

// --- Create booking coupon attach ---
{
  const applied = buildAppliedCouponParams({
    code: 'save50',
    chargeScope: 'RIDE_FARE',
    rideType: 'regular',
    discountAmount: 50,
  });
  assert.ok(applied);
  const payload = withCouponOnCreateBooking(
    { rideId: 'r1', seats: 1, paymentMethod: 'PAY_LATER' },
    applied,
  );
  assert.equal(payload.couponCode, 'SAVE50');
  assert.equal(payload.couponChargeScope, 'RIDE_FARE');
}

{
  const empty = withCouponOnCreateBooking(
    { rideId: 'r1', seats: 1, paymentMethod: 'PAY_LATER' },
    null,
  );
  assert.equal('couponCode' in empty, false);
}

console.log('coupons.mapper.test.ts: ok');
