/** OpenAPI-aligned coupon types (mobile-facing). */

export type CouponRideTypeScope = 'ALL' | 'REGULAR' | 'ASSURED' | 'OFFICE_COMMUTE';

export type CouponChargeScope = 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT' | 'BOTH';

export type CouponBenefitType =
  | 'POINTS_CREDIT'
  | 'FIXED_DISCOUNT'
  | 'PERCENTAGE_DISCOUNT'
  | string;

export type CouponApplicableTo = 'ALL' | 'DRIVERS_ONLY' | 'RIDERS_ONLY';

/** Screen / transaction context — not a permanent global user role. */
export type CouponActorContext = 'RIDER' | 'DRIVER';

export interface ValidateCouponDto {
  code: string;
  rideType: CouponRideTypeScope;
  chargeScope: CouponChargeScope;
  /** Eligible charge amount in points (optional on validate). */
  amount?: string;
}

export interface PreviewCouponDto {
  code: string;
  rideType: CouponRideTypeScope;
  chargeScope: CouponChargeScope;
  /** Authoritative eligible amount for preview math. */
  amount: string;
}

/**
 * Normalized coupon catalog item.
 * Response schemas are not published in OpenAPI — fields are read defensively.
 */
export interface CouponDto {
  id: string;
  code: string;
  title: string;
  description: string | null;
  benefitType: CouponBenefitType;
  benefitValue: string;
  maxDiscountAmount: string | null;
  minEligibleAmount: string | null;
  rideTypeScope: CouponRideTypeScope | string;
  chargeScope: CouponChargeScope | string;
  /** Raw backend audience string, preserved for compatibility. */
  audience: string | null;
  /**
   * Eligibility audience. Missing/unknown values default to ALL.
   * Parsed from `applicableTo`, then a matching `audience` enum, else ALL.
   */
  applicableTo: CouponApplicableTo;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface CouponPageDto {
  items: CouponDto[];
  page: number;
  limit: number;
  total: number | null;
}

/**
 * Result of POST /coupons/validate or /coupons/preview.
 * Discount amounts always come from the server — never invent them client-side.
 */
export interface CouponPreviewResultDto {
  valid: boolean;
  code: string;
  title: string | null;
  message: string | null;
  benefitType: CouponBenefitType | null;
  benefitValue: string | null;
  /** Points discounted for FIXED/PERCENTAGE (backend `discountAmount`). */
  discountAmount: string | null;
  /**
   * Charge after discount (backend `finalAmount`).
   * Same as original for POINTS_CREDIT when no fare reduction.
   */
  amountAfterDiscount: string | null;
  /** Backend `originalAmount` — eligible charge used for preview. */
  originalAmount: string | null;
  /** Backend `pointsCredit` when benefitType is POINTS_CREDIT. */
  pointsCredit: string | null;
  chargeScope: CouponChargeScope | string | null;
  rideTypeScope: CouponRideTypeScope | string | null;
  expiresAt: string | null;
  raw: unknown;
}
