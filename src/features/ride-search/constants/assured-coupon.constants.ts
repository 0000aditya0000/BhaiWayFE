/** Backend coupon type for deposit-only redemption on the next Assured booking. */
export const NEXT_ASSURED_DEPOSIT_FREE = 'NEXT_ASSURED_DEPOSIT_FREE' as const;

export type AssuredDepositCouponType = typeof NEXT_ASSURED_DEPOSIT_FREE;

export interface AssuredCouponDisplay {
  title: string;
  description: string;
  /** Coupon removes security deposit only — never ride fare. */
  appliesToDeposit: true;
  appliesToFare: false;
}

const DEPOSIT_FREE_COUPON_DISPLAY: AssuredCouponDisplay = {
  title: 'Deposit-Free Assured Ride',
  description:
    'Removes the security deposit on your next eligible Assured booking. Does not reduce ride fare.',
  appliesToDeposit: true,
  appliesToFare: false,
};

/** Maps backend coupon type codes to passenger-facing copy. */
export const getAssuredCouponDisplay = (
  couponType: string | null | undefined,
): AssuredCouponDisplay | null => {
  const normalized = String(couponType ?? '').trim().toUpperCase();
  if (normalized === NEXT_ASSURED_DEPOSIT_FREE) {
    return DEPOSIT_FREE_COUPON_DISPLAY;
  }
  return null;
};
