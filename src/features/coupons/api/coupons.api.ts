import { ENDPOINTS, httpClient } from '@/network';

import {
  buildPreviewCouponBody,
  buildValidateCouponBody,
  normalizeCoupon,
  normalizeCouponPage,
  normalizeCouponPreviewResult,
} from '../utils/coupons.mapper';
import type {
  CouponChargeScope,
  CouponDto,
  CouponPageDto,
  CouponPreviewResultDto,
  CouponRideTypeScope,
} from './coupons.types';

export type {
  CouponBenefitType,
  CouponChargeScope,
  CouponDto,
  CouponPageDto,
  CouponPreviewResultDto,
  CouponRideTypeScope,
  PreviewCouponDto,
  ValidateCouponDto,
} from './coupons.types';

const listPath = (
  base: string,
  query: { page?: number; limit?: number } = {},
): string => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  return `${base}?${params.toString()}`;
};

/** GET /coupons/public */
export const listPublicCoupons = async (
  query: { page?: number; limit?: number } = {},
): Promise<CouponPageDto> => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
  const payload = await httpClient.get<unknown>(
    listPath(ENDPOINTS.coupons.public, { page, limit }),
  );
  return normalizeCouponPage(payload, { page, limit });
};

/** GET /coupons/mine */
export const listMyCoupons = async (
  query: { page?: number; limit?: number } = {},
): Promise<CouponPageDto> => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
  const payload = await httpClient.get<unknown>(
    listPath(ENDPOINTS.coupons.mine, { page, limit }),
  );
  return normalizeCouponPage(payload, { page, limit });
};

/** GET /coupons/:id */
export const getCouponById = async (id: string): Promise<CouponDto | null> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.coupons.byId(id));
  return normalizeCoupon(payload);
};

/** POST /coupons/validate — no capacity consumed. */
export const validateCoupon = async (input: {
  code: string;
  rideType: CouponRideTypeScope;
  chargeScope: CouponChargeScope;
  amount?: string | number | null;
}): Promise<CouponPreviewResultDto> => {
  const body = buildValidateCouponBody(input);
  const payload = await httpClient.post<unknown>(ENDPOINTS.coupons.validate, body);
  return normalizeCouponPreviewResult(payload, body.code);
};

/** POST /coupons/preview — no capacity consumed. */
export const previewCoupon = async (input: {
  code: string;
  rideType: CouponRideTypeScope;
  chargeScope: CouponChargeScope;
  amount: string | number;
}): Promise<CouponPreviewResultDto> => {
  const body = buildPreviewCouponBody(input);
  const payload = await httpClient.post<unknown>(ENDPOINTS.coupons.preview, body);
  return normalizeCouponPreviewResult(payload, body.code);
};
