import type {
  CouponChargeScope,
  CouponDto,
  CouponPageDto,
  CouponPreviewResultDto,
  CouponRideTypeScope,
  PreviewCouponDto,
  ValidateCouponDto,
} from '../api/coupons.types';
import { parseCouponApplicableTo } from './couponAudience';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asString = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const asBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === '0') {
      return false;
    }
  }
  return fallback;
};

const asCoinString = (value: unknown): string | null => {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.max(0, Math.round(value)));
  }
  const cleaned = String(value).trim().replace(/,/g, '');
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return cleaned;
  }
  return String(Math.max(0, Math.round(parsed)));
};

const firstRecord = (...values: unknown[]): Record<string, unknown> | null => {
  for (const value of values) {
    const record = asRecord(value);
    if (record) {
      return record;
    }
  }
  return null;
};

const readApplicableToRaw = (record: Record<string, unknown>): unknown => {
  const nestedCoupon = asRecord(record.coupon);
  const nestedMeta = asRecord(record.metadata);
  return (
    record.applicableTo ??
    record.applicable_to ??
    record.applicableFor ??
    record.applicable_for ??
    record.targetAudience ??
    record.target_audience ??
    nestedCoupon?.applicableTo ??
    nestedCoupon?.applicable_to ??
    nestedMeta?.applicableTo ??
    nestedMeta?.applicable_to
  );
};

export const normalizeCoupon = (raw: unknown): CouponDto | null => {
  const outer = asRecord(raw);
  if (!outer) {
    return null;
  }
  const record = firstRecord(asRecord(outer.coupon), outer) ?? outer;
  const id = asString(record.id) ?? asString(record.couponId) ?? asString(outer.id);
  const code = (asString(record.code) ?? asString(outer.code))?.toUpperCase();
  const title = asString(record.title) ?? asString(record.name) ?? asString(outer.title);
  if (!id || !code || !title) {
    return null;
  }
  const audience = asString(record.audience) ?? asString(outer.audience);
  return {
    id,
    code,
    title,
    description: asString(record.description) ?? asString(outer.description),
    benefitType: asString(record.benefitType) ?? asString(outer.benefitType) ?? 'FIXED_DISCOUNT',
    benefitValue: asCoinString(record.benefitValue) ?? asCoinString(outer.benefitValue) ?? '0',
    maxDiscountAmount:
      asCoinString(record.maxDiscountAmount) ?? asCoinString(outer.maxDiscountAmount),
    minEligibleAmount:
      asCoinString(record.minEligibleAmount) ?? asCoinString(outer.minEligibleAmount),
    rideTypeScope:
      asString(record.rideTypeScope) ?? asString(outer.rideTypeScope) ?? 'ALL',
    chargeScope: asString(record.chargeScope) ?? asString(outer.chargeScope) ?? 'RIDE_FARE',
    audience,
    applicableTo: parseCouponApplicableTo(readApplicableToRaw(record) ?? readApplicableToRaw(outer), audience),
    startsAt: asString(record.startsAt) ?? asString(outer.startsAt),
    expiresAt: asString(record.expiresAt) ?? asString(outer.expiresAt),
    isActive: asBool(record.isActive ?? outer.isActive, true),
  };
};

export const normalizeCouponPage = (
  payload: unknown,
  fallback: { page: number; limit: number },
): CouponPageDto => {
  const record = asRecord(payload);
  const listCandidate =
    (record && Array.isArray(record.items) && record.items) ||
    (record && Array.isArray(record.data) && record.data) ||
    (record && Array.isArray(record.results) && record.results) ||
    (Array.isArray(payload) ? payload : []);

  const items = (listCandidate as unknown[])
    .map(normalizeCoupon)
    .filter((item): item is CouponDto => item != null);

  const page =
    typeof record?.page === 'number' && Number.isFinite(record.page)
      ? Math.max(1, Math.floor(record.page))
      : fallback.page;
  const limit =
    typeof record?.limit === 'number' && Number.isFinite(record.limit)
      ? Math.max(1, Math.floor(record.limit))
      : fallback.limit;
  const totalRaw = record?.total ?? record?.totalCount;
  const total =
    typeof totalRaw === 'number' && Number.isFinite(totalRaw)
      ? Math.max(0, Math.floor(totalRaw))
      : null;

  return { items, page, limit, total };
};

export const normalizeCouponPreviewResult = (
  payload: unknown,
  fallbackCode: string,
): CouponPreviewResultDto => {
  const record = asRecord(payload);
  const nested =
    asRecord(record?.data) ??
    asRecord(record?.result) ??
    asRecord(record?.preview) ??
    record;

  const explicitInvalid =
    nested &&
    (nested.valid === false ||
      nested.isValid === false ||
      nested.success === false ||
      Boolean(asString(nested.error) || asString(nested.errorMessage)));

  const discountAmount =
    asCoinString(nested?.discountAmount) ??
    asCoinString(nested?.discountPoints) ??
    asCoinString(nested?.benefitAmount) ??
    asCoinString(nested?.appliedDiscount);

  const originalAmount = asCoinString(nested?.originalAmount);
  const amountAfterDiscount =
    asCoinString(nested?.finalAmount) ?? asCoinString(nested?.amountAfterDiscount);
  const pointsCredit = asCoinString(nested?.pointsCredit);

  const message =
    asString(nested?.message) ??
    asString(nested?.errorMessage) ??
    asString(nested?.error) ??
    (typeof nested?.error === 'object'
      ? asString(asRecord(nested.error)?.message)
      : null);

  // Backend success path returns `{ valid: true, ... }`. Errors throw HTTP exceptions.
  const valid =
    !explicitInvalid &&
    (asBool(nested?.valid, false) ||
      asBool(nested?.isValid, false) ||
      asBool(nested?.success, false) ||
      (discountAmount != null &&
        Number(discountAmount) >= 0 &&
        !message?.toLowerCase().includes('invalid')));

  return {
    valid,
    code: (asString(nested?.code) ?? fallbackCode).toUpperCase(),
    title: asString(nested?.title) ?? asString(nested?.couponTitle),
    message,
    benefitType: asString(nested?.benefitType),
    benefitValue: asCoinString(nested?.benefitValue),
    discountAmount: valid ? discountAmount : null,
    amountAfterDiscount: valid ? amountAfterDiscount : null,
    originalAmount: valid ? originalAmount : null,
    pointsCredit: valid ? pointsCredit : null,
    chargeScope: asString(nested?.chargeScope),
    rideTypeScope: asString(nested?.rideTypeScope),
    expiresAt: asString(nested?.expiresAt),
    raw: payload,
  };
};

export const buildValidateCouponBody = (input: {
  code: string;
  rideType: CouponRideTypeScope;
  chargeScope: CouponChargeScope;
  amount?: string | number | null;
}): ValidateCouponDto => {
  const body: ValidateCouponDto = {
    code: input.code.trim().toUpperCase(),
    rideType: input.rideType,
    chargeScope: input.chargeScope,
  };
  const amount = asCoinString(input.amount);
  if (amount) {
    body.amount = amount;
  }
  return body;
};

export const buildPreviewCouponBody = (input: {
  code: string;
  rideType: CouponRideTypeScope;
  chargeScope: CouponChargeScope;
  amount: string | number;
}): PreviewCouponDto => ({
  code: input.code.trim().toUpperCase(),
  rideType: input.rideType,
  chargeScope: input.chargeScope,
  amount: asCoinString(input.amount) ?? '0',
});

/** Map UI ride type → coupon API rideType. */
export const toCouponRideType = (
  rideType: 'regular' | 'assured' | 'commute' | string,
): CouponRideTypeScope => {
  const key = String(rideType ?? '')
    .trim()
    .toLowerCase();
  if (key === 'assured') {
    return 'ASSURED';
  }
  if (key === 'commute' || key === 'office_commute' || key === 'office-commute') {
    return 'OFFICE_COMMUTE';
  }
  if (key === 'regular') {
    return 'REGULAR';
  }
  return 'ALL';
};

/**
 * Default charge scope for apply/preview by booking mode.
 * BOTH is not accepted at apply-time — pick one charge.
 */
export const defaultCouponChargeScope = (
  rideType: 'regular' | 'assured' | 'commute' | string,
): Exclude<CouponChargeScope, 'BOTH'> => {
  const key = String(rideType ?? '')
    .trim()
    .toLowerCase();
  if (key === 'assured') {
    return 'ASSURED_SECURITY_DEPOSIT';
  }
  return 'RIDE_FARE';
};

export const resolveCouponEligibleAmount = (input: {
  chargeScope: CouponChargeScope | string;
  rideFare: number;
  assuredFee: number;
}): string => {
  const scope = String(input.chargeScope ?? '')
    .trim()
    .toUpperCase();
  if (scope === 'ASSURED_SECURITY_DEPOSIT') {
    return String(Math.max(0, Math.round(input.assuredFee)));
  }
  if (scope === 'BOTH') {
    // Preview only — apply-time must pick one charge.
    return String(Math.max(0, Math.round(input.rideFare + input.assuredFee)));
  }
  return String(Math.max(0, Math.round(input.rideFare)));
};
