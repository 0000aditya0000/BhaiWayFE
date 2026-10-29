import { ENDPOINTS, httpClient } from '@/network';

import type {
  ListReferralsQuery,
  ReferralPageDto,
  ReferralSummaryDto,
} from './referrals.types';
import {
  normalizeReferralPage,
  normalizeReferralSummary,
} from '../utils/referrals.mapper';

export type {
  ListReferralsQuery,
  ReferralListItemDto,
  ReferralPageDto,
  ReferralReferredUserDto,
  ReferralStatus,
  ReferralSummaryDto,
} from './referrals.types';

/** GET /referrals/summary */
export const getReferralSummary = async (): Promise<ReferralSummaryDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.referrals.summary);
  return normalizeReferralSummary(payload);
};

/** GET /referrals?page=&limit= */
export const listReferrals = async (
  query: ListReferralsQuery = {},
): Promise<ReferralPageDto> => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.referrals.list}?${params.toString()}`,
  );
  return normalizeReferralPage(payload, { page, limit });
};
