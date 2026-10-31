import assert from 'node:assert/strict';

import { buildAppliedCouponParams, withCouponOnCreateBooking } from './bookingCouponParams';
import { applyCouponDiscountToFare, resolveApplyChargeScope } from './couponFare.utils';
import {
  buildPreviewCouponBody,
  buildValidateCouponBody,
  normalizeCoupon,
  normalizeCouponPreviewResult,
} from './coupons.mapper';

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

{
  const missing = normalizeCoupon({
    id: 'c1',
    code: 'ALL50',
    title: 'Everyone',
    benefitType: 'FIXED_DISCOUNT',
    benefitValue: '50',
  });
  assert.ok(missing);
  assert.equal(missing.applicableTo, 'ALL');
  assert.equal(missing.audience, null);
}

{
  const fromApplicable = normalizeCoupon({
    id: 'c2',
    code: 'DRV10',
    title: 'Drivers',
    applicableTo: 'DRIVERS_ONLY',
    audience: 'RIDERS_ONLY',
  });
  assert.ok(fromApplicable);
  assert.equal(fromApplicable.applicableTo, 'DRIVERS_ONLY');
  assert.equal(fromApplicable.audience, 'RIDERS_ONLY');
}

{
  const fromAudience = normalizeCoupon({
    id: 'c3',
    code: 'RID10',
    title: 'Riders',
    audience: 'RIDERS_ONLY',
  });
  assert.ok(fromAudience);
  assert.equal(fromAudience.applicableTo, 'RIDERS_ONLY');
}

{
  const unknownAudience = normalizeCoupon({
    id: 'c4',
    code: 'PUB10',
    title: 'Public',
    audience: 'PUBLIC',
  });
  assert.ok(unknownAudience);
  assert.equal(unknownAudience.applicableTo, 'ALL');
}

{
  const driverAlias = normalizeCoupon({
    id: 'c5',
    code: 'DRV20',
    title: 'Driver alias',
    audience: 'PUBLIC',
    applicableTo: 'DRIVER',
  });
  assert.ok(driverAlias);
  assert.equal(driverAlias.applicableTo, 'DRIVERS_ONLY');
}

{
  const nestedDriver = normalizeCoupon({
    id: 'c6',
    code: 'DRV30',
    title: 'Nested driver',
    coupon: { applicableTo: 'DRIVERS_ONLY' },
    audience: 'PUBLIC',
  });
  assert.ok(nestedDriver);
  assert.equal(nestedDriver.applicableTo, 'DRIVERS_ONLY');
}

{
  const previewBody = buildPreviewCouponBody({
    code: 'SAVE50',
    rideType: 'REGULAR',
    chargeScope: 'RIDE_FARE',
    amount: 200,
  });
  assert.deepEqual(Object.keys(previewBody).sort(), [
    'amount',
    'chargeScope',
    'code',
    'rideType',
  ]);
  assert.equal('actorContext' in previewBody, false);
  assert.equal('applicableTo' in previewBody, false);

  const validateBody = buildValidateCouponBody({
    code: 'SAVE50',
    rideType: 'REGULAR',
    chargeScope: 'RIDE_FARE',
  });
  assert.equal('actorContext' in validateBody, false);
  assert.equal('applicableTo' in validateBody, false);
}

console.log('coupons.mapper.test.ts: ok');
