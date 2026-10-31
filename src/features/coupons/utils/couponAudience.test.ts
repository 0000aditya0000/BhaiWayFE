import assert from 'node:assert/strict';

import type { CouponDto } from '../api/coupons.types';
import { couponCatalogCache } from '../store/couponCatalogCache';
import { buildCouponContextKey } from '../store/couponApplyBridgeStore';
import {
  couponActorContextFromAppMode,
  couponVisibleForContext,
  filterCouponsForContext,
  parseCouponActorContext,
  parseCouponApplicableTo,
  resolveCouponActorContext,
} from './couponAudience';
import {
  applyDriverCouponRedemption,
  COUPON_ERROR_CODES,
  DRIVER_COUPON_CAPABILITIES,
  couponErrorUserMessage,
  isCouponAudienceMismatchError,
} from './couponErrors';

const coupon = (patch: Partial<CouponDto>): CouponDto => ({
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
  applicableTo: 'ALL',
  startsAt: null,
  expiresAt: null,
  isActive: true,
  ...patch,
});

assert.equal(parseCouponApplicableTo(undefined), 'ALL');
assert.equal(parseCouponApplicableTo(null, null), 'ALL');
assert.equal(parseCouponApplicableTo('DRIVERS_ONLY'), 'DRIVERS_ONLY');
assert.equal(parseCouponApplicableTo(undefined, 'RIDERS_ONLY'), 'RIDERS_ONLY');
assert.equal(parseCouponApplicableTo('DRIVERS_ONLY', 'RIDERS_ONLY'), 'DRIVERS_ONLY');
assert.equal(parseCouponApplicableTo('PUBLIC', 'SOMETHING'), 'ALL');
assert.equal(parseCouponApplicableTo(undefined, 'PUBLIC'), 'ALL');
assert.equal(parseCouponApplicableTo(undefined, 'USER_SPECIFIC'), 'ALL');
assert.equal(parseCouponApplicableTo('DRIVER'), 'DRIVERS_ONLY');
assert.equal(parseCouponApplicableTo('drivers'), 'DRIVERS_ONLY');
assert.equal(parseCouponApplicableTo('RIDER'), 'RIDERS_ONLY');
assert.equal(parseCouponApplicableTo('passenger'), 'RIDERS_ONLY');
assert.equal(parseCouponApplicableTo('DRIVERS_ONLY', 'PUBLIC'), 'DRIVERS_ONLY');

assert.equal(parseCouponActorContext('driver'), 'DRIVER');
assert.equal(parseCouponActorContext('riding'), 'RIDER');
assert.equal(
  resolveCouponActorContext({ couponContext: 'driver', rideId: 'abc' }),
  'DRIVER',
);
assert.equal(
  resolveCouponActorContext({ couponContext: '', rideId: 'driver-publish-regular' }),
  'DRIVER',
);
assert.equal(
  resolveCouponActorContext({ couponContext: 'rider', rideId: 'ride-123' }),
  'RIDER',
);
assert.equal(couponActorContextFromAppMode('driving'), 'DRIVER');
assert.equal(couponActorContextFromAppMode('riding'), 'RIDER');

const all = coupon({ code: 'ALL1', applicableTo: 'ALL' });
const riders = coupon({ code: 'RID1', applicableTo: 'RIDERS_ONLY' });
const drivers = coupon({ code: 'DRV1', applicableTo: 'DRIVERS_ONLY' });

assert.equal(couponVisibleForContext(all, 'RIDER'), true);
assert.equal(couponVisibleForContext(riders, 'RIDER'), true);
assert.equal(couponVisibleForContext(drivers, 'RIDER'), false);

assert.equal(couponVisibleForContext(all, 'DRIVER'), true);
assert.equal(couponVisibleForContext(drivers, 'DRIVER'), true);
assert.equal(couponVisibleForContext(riders, 'DRIVER'), false);

const riderList = filterCouponsForContext([all, riders, drivers], 'RIDER').map((item) => item.code);
const driverList = filterCouponsForContext([all, riders, drivers], 'DRIVER').map((item) => item.code);
assert.deepEqual(riderList, ['ALL1', 'RID1']);
assert.deepEqual(driverList, ['ALL1', 'DRV1']);
assert.equal(driverList.includes('RID1'), false);
assert.equal(riderList.includes('DRV1'), false);

couponCatalogCache.clear();
couponCatalogCache.set('RIDER', [all, riders]);
couponCatalogCache.set('DRIVER', [all, drivers]);
assert.deepEqual(
  couponCatalogCache.get('RIDER')?.map((item) => item.code),
  ['ALL1', 'RID1'],
);
assert.deepEqual(
  couponCatalogCache.get('DRIVER')?.map((item) => item.code),
  ['ALL1', 'DRV1'],
);
couponCatalogCache.clear('DRIVER');
assert.equal(couponCatalogCache.get('DRIVER'), null);
assert.ok(couponCatalogCache.get('RIDER'));
couponCatalogCache.clear();

const riderKey = buildCouponContextKey({
  actorContext: 'RIDER',
  rideId: 'ride-1',
  rideType: 'regular',
  seats: 1,
  rideFare: 200,
  assuredFee: 0,
});
const driverKey = buildCouponContextKey({
  actorContext: 'DRIVER',
  rideId: 'ride-1',
  rideType: 'regular',
  seats: 1,
  rideFare: 200,
  assuredFee: 0,
});
assert.equal(riderKey.startsWith('RIDER|'), true);
assert.equal(driverKey.startsWith('DRIVER|'), true);
assert.notEqual(riderKey, driverKey);

assert.equal(DRIVER_COUPON_CAPABILITIES.validation, false);
assert.equal(DRIVER_COUPON_CAPABILITIES.preview, false);
assert.equal(DRIVER_COUPON_CAPABILITIES.redemption, false);
assert.equal(applyDriverCouponRedemption().ok, false);

assert.equal(
  isCouponAudienceMismatchError({
    status: 400,
    code: COUPON_ERROR_CODES.DRIVERS_ONLY,
    message: 'This coupon is for drivers only.',
  }),
  true,
);
assert.equal(
  isCouponAudienceMismatchError({
    status: 400,
    code: COUPON_ERROR_CODES.RIDERS_ONLY,
    message: 'This coupon is for riders only.',
  }),
  true,
);
assert.equal(
  couponErrorUserMessage({
    status: 400,
    code: COUPON_ERROR_CODES.DRIVERS_ONLY,
    message: 'This coupon is for drivers only.',
  }),
  'This coupon is for drivers only.',
);

console.log('couponAudience.test.ts: ok');
