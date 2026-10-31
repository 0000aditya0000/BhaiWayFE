export const COUPON_ERROR_CODES = {
  DRIVERS_ONLY: 'COUPON_DRIVERS_ONLY',
  RIDERS_ONLY: 'COUPON_RIDERS_ONLY',
} as const;

export type CouponAudienceErrorCode =
  (typeof COUPON_ERROR_CODES)[keyof typeof COUPON_ERROR_CODES];

/**
 * Backend driver coupon contracts are not published.
 * Listing reuses GET /coupons/public and /coupons/mine (client-filtered).
 * Do not call rider validate/preview/booking redeem as a driver override.
 */
export const DRIVER_COUPON_CAPABILITIES = {
  publicAndMineListing: true,
  driverSpecificListingEndpoint: false,
  validation: false,
  preview: false,
  redemption: false,
} as const;

export const DRIVER_COUPON_REDEMPTION_UNSUPPORTED =
  'This offer cannot be applied to a driver transaction yet.';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const readErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error.trim();
  }
  const record = asRecord(error);
  if (record && typeof record.message === 'string') {
    return record.message.trim();
  }
  if (error instanceof Error) {
    return error.message.trim();
  }
  return '';
};

export const getCouponErrorCode = (error: unknown): string | null => {
  const record = asRecord(error);
  if (!record) {
    return null;
  }
  const direct = record.code;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim().toUpperCase();
  }
  const nested = asRecord(record.details);
  if (nested && typeof nested.code === 'string' && nested.code.trim()) {
    return nested.code.trim().toUpperCase();
  }
  const nestedError = asRecord(record.error);
  if (nestedError && typeof nestedError.code === 'string' && nestedError.code.trim()) {
    return nestedError.code.trim().toUpperCase();
  }
  return null;
};

export const isCouponAudienceMismatchError = (
  error: unknown,
  message?: string | null,
): boolean => {
  const code = getCouponErrorCode(error);
  if (
    code === COUPON_ERROR_CODES.DRIVERS_ONLY ||
    code === COUPON_ERROR_CODES.RIDERS_ONLY
  ) {
    return true;
  }
  const text = `${message ?? ''} ${typeof error === 'string' ? error : readErrorMessage(error)}`
    .toUpperCase();
  return (
    text.includes('COUPON_DRIVERS_ONLY') ||
    text.includes('COUPON_RIDERS_ONLY')
  );
};

export const couponErrorUserMessage = (
  error: unknown,
  fallback = 'This coupon is not eligible for this booking.',
): string => {
  const message = readErrorMessage(error);
  if (message) {
    return message;
  }
  return fallback;
};

/** Driver apply must not invent a discount or call rider preview/validate. */
export const applyDriverCouponRedemption = (): {
  ok: false;
  message: string;
} => ({
  ok: false,
  message: DRIVER_COUPON_REDEMPTION_UNSUPPORTED,
});
