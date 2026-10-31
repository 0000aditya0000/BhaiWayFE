import type { CouponDto } from '../api/coupons.types';
import type { CouponActorContext } from '../utils/couponAudience';

type CatalogBucket = {
  items: CouponDto[];
};

const buckets: Record<CouponActorContext, CatalogBucket | null> = {
  RIDER: null,
  DRIVER: null,
};

/**
 * In-memory catalog split by actor context.
 * Rider and driver lists must never share a bucket.
 */
export const couponCatalogCache = {
  get: (context: CouponActorContext): CouponDto[] | null => {
    const bucket = buckets[context];
    return bucket ? bucket.items.slice() : null;
  },
  set: (context: CouponActorContext, items: CouponDto[]): void => {
    buckets[context] = { items: items.slice() };
  },
  clear: (context?: CouponActorContext): void => {
    if (context) {
      buckets[context] = null;
      return;
    }
    buckets.RIDER = null;
    buckets.DRIVER = null;
  },
};
