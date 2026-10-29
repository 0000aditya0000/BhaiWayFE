import { ENDPOINTS, httpClient } from '@/network';

import {
  mergeProgressIntoCampaign,
  normalizeCampaign,
  normalizeCampaignList,
  normalizeClaim,
  normalizeClaimPage,
  normalizeProgress,
} from '../utils/commuteRewards.mapper';
import type {
  CommuteRewardCampaignDto,
  CommuteRewardClaimDto,
  CommuteRewardClaimPageDto,
  CommuteRewardProgressDto,
} from './commuteRewards.types';

export type {
  CommuteRewardCampaignDto,
  CommuteRewardClaimDto,
  CommuteRewardClaimPageDto,
  CommuteRewardClaimStatus,
  CommuteRewardMilestoneDto,
  CommuteRewardProgressDto,
} from './commuteRewards.types';

/** GET /commute-rewards/campaigns */
export const listActiveCommuteRewardCampaigns = async (): Promise<
  CommuteRewardCampaignDto[]
> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.commuteRewards.campaigns);
  return normalizeCampaignList(payload);
};

/** GET /commute-rewards/campaigns/:id */
export const getCommuteRewardCampaign = async (
  id: string,
): Promise<CommuteRewardCampaignDto | null> => {
  const payload = await httpClient.get<unknown>(
    ENDPOINTS.commuteRewards.campaignById(id),
  );
  return normalizeCampaign(payload);
};

/** GET /commute-rewards/campaigns/:id/progress */
export const getCommuteRewardCampaignProgress = async (
  id: string,
): Promise<CommuteRewardProgressDto> => {
  const payload = await httpClient.get<unknown>(
    ENDPOINTS.commuteRewards.campaignProgress(id),
  );
  return normalizeProgress(payload, id);
};

/**
 * Load campaign detail with own progress.
 * Prefers dedicated progress endpoint; falls back to detail payload alone.
 */
export const getCommuteRewardCampaignWithProgress = async (
  id: string,
): Promise<CommuteRewardCampaignDto | null> => {
  const campaign = await getCommuteRewardCampaign(id);
  if (!campaign) {
    return null;
  }
  try {
    const progress = await getCommuteRewardCampaignProgress(id);
    return mergeProgressIntoCampaign(campaign, progress);
  } catch {
    return campaign;
  }
};

/** POST /commute-rewards/campaigns/:campaignId/milestones/:milestoneId/claims */
export const claimCommuteRewardMilestone = async (
  campaignId: string,
  milestoneId: string,
): Promise<CommuteRewardClaimDto | null> => {
  const payload = await httpClient.post<unknown>(
    ENDPOINTS.commuteRewards.claim(campaignId, milestoneId),
    {},
  );
  return normalizeClaim(payload);
};

/** GET /commute-rewards/claims */
export const listMyCommuteRewardClaims = async (
  query: { page?: number; limit?: number } = {},
): Promise<CommuteRewardClaimPageDto> => {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.commuteRewards.claims}?${params.toString()}`,
  );
  return normalizeClaimPage(payload, { page, limit });
};
