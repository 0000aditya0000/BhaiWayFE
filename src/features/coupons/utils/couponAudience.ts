import type { CouponDto } from '../api/coupons.types';

export type CouponApplicableTo = 'ALL' | 'DRIVERS_ONLY' | 'RIDERS_ONLY';

/** Screen / transaction context — not a permanent global user role. */
export type CouponActorContext = 'RIDER' | 'DRIVER';

const asTrimmedUpper = (value: unknown): string => String(value ?? '').trim().toUpperCase();

const DISTRIBUTION_AUDIENCE = new Set(['PUBLIC', 'USER_SPECIFIC', 'USER-SPECIFIC']);

const APPLICABLE_ALIASES: Record<string, CouponApplicableTo> = {
  ALL: 'ALL',
  EVERYONE: 'ALL',
  BOTH: 'ALL',
  ANY: 'ALL',
  DRIVERS_ONLY: 'DRIVERS_ONLY',
  DRIVER_ONLY: 'DRIVERS_ONLY',
  'DRIVERS-ONLY': 'DRIVERS_ONLY',
  'DRIVER-ONLY': 'DRIVERS_ONLY',
  DRIVERS: 'DRIVERS_ONLY',
  DRIVER: 'DRIVERS_ONLY',
  DRIVING: 'DRIVERS_ONLY',
  RIDERS_ONLY: 'RIDERS_ONLY',
  RIDER_ONLY: 'RIDERS_ONLY',
  'RIDERS-ONLY': 'RIDERS_ONLY',
  'RIDER-ONLY': 'RIDERS_ONLY',
  RIDERS: 'RIDERS_ONLY',
  RIDER: 'RIDERS_ONLY',
  PASSENGER: 'RIDERS_ONLY',
  PASSENGERS: 'RIDERS_ONLY',
  PASSENGERS_ONLY: 'RIDERS_ONLY',
  PASSENGER_ONLY: 'RIDERS_ONLY',
};

export const parseCouponApplicableTo = (
  applicableTo?: unknown,
  audienceFallback?: unknown,
): CouponApplicableTo => {
  const primary = APPLICABLE_ALIASES[asTrimmedUpper(applicableTo)];
  if (primary) {
    return primary;
  }
  const fallbackKey = asTrimmedUpper(audienceFallback);
  if (!DISTRIBUTION_AUDIENCE.has(fallbackKey)) {
    const fallback = APPLICABLE_ALIASES[fallbackKey];
    if (fallback) {
      return fallback;
    }
  }
  return 'ALL';
};

export const parseCouponActorContext = (value: unknown): CouponActorContext => {
  const key = asTrimmedUpper(value);
  if (
    key === 'DRIVER' ||
    key === 'DRIVERS' ||
    key === 'DRIVING' ||
    key === 'DRIVERS_ONLY' ||
    key === 'PUBLISH'
  ) {
    return 'DRIVER';
  }
  return 'RIDER';
};

export const couponActorContextFromAppMode = (
  mode: 'riding' | 'driving' | string | null | undefined,
): CouponActorContext => (asTrimmedUpper(mode) === 'DRIVING' ? 'DRIVER' : 'RIDER');

/** Prefer explicit route context; publish flows also use a driver-prefixed rideId. */
export const resolveCouponActorContext = (input: {
  couponContext?: unknown;
  rideId?: unknown;
}): CouponActorContext => {
  const fromParam = String(input.couponContext ?? '').trim();
  if (fromParam) {
    return parseCouponActorContext(fromParam);
  }
  const rideId = String(input.rideId ?? '').trim().toLowerCase();
  if (rideId.startsWith('driver-')) {
    return 'DRIVER';
  }
  return 'RIDER';
};

export const couponVisibleForContext = (
  coupon:
    | Pick<CouponDto, 'applicableTo' | 'audience'>
    | { applicableTo?: string | null; audience?: string | null },
  context: CouponActorContext,
): boolean => {
  const applicable = parseCouponApplicableTo(coupon.applicableTo, coupon.audience);
  if (applicable === 'ALL') {
    return true;
  }
  if (context === 'RIDER') {
    return applicable === 'RIDERS_ONLY';
  }
  return applicable === 'DRIVERS_ONLY';
};

export const filterCouponsForContext = <
  T extends
    | Pick<CouponDto, 'applicableTo' | 'audience'>
    | { applicableTo?: string | null; audience?: string | null },
>(
  coupons: readonly T[],
  context: CouponActorContext,
): T[] => coupons.filter((coupon) => couponVisibleForContext(coupon, context));

export const couponCatalogCacheKey = (context: CouponActorContext): string =>
  `coupons:catalog:${context}`;
