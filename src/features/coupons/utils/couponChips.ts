import type { CouponDto } from '../api/coupons.types';
import {
  AVAILABLE_COUPONS_SCREEN,
} from '../constants/available-coupons.constants';
import {
  PROMOTIONS_COUPONS_SCREEN,
  formatCouponChargeScopeLabel,
  formatCouponRideTypeLabel,
} from '../constants/promotions-coupons.constants';
import type { CouponTicketChip } from '../components/CouponTicketCard';

const formatCouponDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const buildAvailableCouponChips = (coupon: CouponDto): CouponTicketChip[] => {
  const chips: CouponTicketChip[] = [];
  const benefit = String(coupon.benefitType ?? '').toUpperCase();
  const expires = formatCouponDate(coupon.expiresAt);

  if (coupon.minEligibleAmount) {
    chips.push({
      icon: 'wallet-outline',
      label: `${AVAILABLE_COUPONS_SCREEN.minAmountPrefix} ${coupon.minEligibleAmount}`,
    });
  }
  if (coupon.maxDiscountAmount && benefit === 'PERCENTAGE_DISCOUNT') {
    chips.push({
      icon: 'pricetag-outline',
      label: `${AVAILABLE_COUPONS_SCREEN.maxDiscountPrefix} ${coupon.maxDiscountAmount}`,
    });
  }
  if (expires) {
    chips.push({
      icon: 'calendar-outline',
      label: `${AVAILABLE_COUPONS_SCREEN.expiresPrefix} ${expires}`,
    });
  }
  if (benefit === 'POINTS_CREDIT') {
    chips.push({
      icon: 'gift-outline',
      label: AVAILABLE_COUPONS_SCREEN.pointsCreditHint,
    });
  }
  return chips;
};

export const buildPromotionsCouponChips = (coupon: CouponDto): CouponTicketChip[] => {
  const chips: CouponTicketChip[] = [
    {
      icon: 'car-outline',
      label: formatCouponRideTypeLabel(coupon.rideTypeScope),
    },
    {
      icon: 'card-outline',
      label: formatCouponChargeScopeLabel(coupon.chargeScope),
    },
  ];
  const benefit = String(coupon.benefitType ?? '').toUpperCase();
  const starts = formatCouponDate(coupon.startsAt);
  const expires = formatCouponDate(coupon.expiresAt);

  if (coupon.minEligibleAmount) {
    chips.push({
      icon: 'wallet-outline',
      label: `${PROMOTIONS_COUPONS_SCREEN.minAmountPrefix} ${coupon.minEligibleAmount}`,
    });
  }
  if (coupon.maxDiscountAmount && benefit === 'PERCENTAGE_DISCOUNT') {
    chips.push({
      icon: 'pricetag-outline',
      label: `${PROMOTIONS_COUPONS_SCREEN.maxDiscountPrefix} ${coupon.maxDiscountAmount}`,
    });
  }
  if (starts) {
    chips.push({
      icon: 'play-outline',
      label: `${PROMOTIONS_COUPONS_SCREEN.startsPrefix} ${starts}`,
    });
  }
  if (expires) {
    chips.push({
      icon: 'calendar-outline',
      label: `${PROMOTIONS_COUPONS_SCREEN.expiresPrefix} ${expires}`,
    });
  }
  if (benefit === 'POINTS_CREDIT') {
    chips.push({
      icon: 'gift-outline',
      label: PROMOTIONS_COUPONS_SCREEN.pointsCreditHint,
    });
  }
  return chips;
};
