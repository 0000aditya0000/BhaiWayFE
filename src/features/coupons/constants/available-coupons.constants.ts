export const AVAILABLE_COUPONS_SCREEN = {
  title: 'Available Coupons',
  subtitle: 'Offers you can use on this ride.',
  driverSubtitle: 'Offers for drivers on this trip.',
  emptyTitle: 'No coupons available',
  emptyMessage: 'There are no eligible offers for this booking right now.',
  driverEmptyMessage: 'There are no eligible driver offers for this trip right now.',
  retryLabel: 'Retry',
  applyLabel: 'Apply',
  applyingLabel: 'Checking…',
  appliedLabel: 'Applied',
  expiresPrefix: 'Valid till',
  minAmountPrefix: 'Min. booking',
  maxDiscountPrefix: 'Up to',
  viewAvailableLabel: 'View Available Coupons',
  pointsCreditHint: 'Wallet credit',
} as const;

export const formatCouponBenefitHeadline = (coupon: {
  benefitType: string;
  benefitValue: string;
  maxDiscountAmount?: string | null;
}): string => {
  const type = String(coupon.benefitType ?? '')
    .trim()
    .toUpperCase();
  const value = String(coupon.benefitValue ?? '').trim();
  if (type === 'PERCENTAGE_DISCOUNT') {
    const max = coupon.maxDiscountAmount?.trim();
    return max ? `${value}% off · up to ${max}` : `${value}% off`;
  }
  if (type === 'POINTS_CREDIT') {
    return `${value} Coins credit`;
  }
  if (type === 'FIXED_DISCOUNT') {
    return `${value} Coins off`;
  }
  return value ? `${value} off` : 'Special offer';
};
