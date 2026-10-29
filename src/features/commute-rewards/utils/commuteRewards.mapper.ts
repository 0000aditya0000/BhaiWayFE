import type {
  CommuteRewardCampaignDto,
  CommuteRewardClaimDto,
  CommuteRewardClaimPageDto,
  CommuteRewardClaimStatus,
  CommuteRewardMilestoneDto,
  CommuteRewardProgressDto,
} from '../api/commuteRewards.types';

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

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim().replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }
  return fallback;
};

const asInt = (value: unknown, fallback = 0): number => {
  const n = asNumber(value);
  if (n == null) {
    return fallback;
  }
  return Math.max(0, Math.floor(n));
};

const asBoolOrNull = (value: unknown): boolean | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }
  return null;
};

const normalizeClaimStatus = (value: unknown): CommuteRewardClaimStatus => {
  const text = asString(value)?.toUpperCase();
  if (!text) {
    return 'NONE';
  }
  return text;
};

/**
 * Progress milestones use `milestoneId`; shell milestones use `id`.
 * Prefer backend progress fields: `canClaim`, `tripCountInWindow`.
 */
export const normalizeMilestone = (
  raw: unknown,
  index = 0,
): CommuteRewardMilestoneDto | null => {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }
  const id = asString(record.milestoneId) ?? asString(record.id);
  const title = asString(record.title) ?? asString(record.name);
  const requiredTrips = asNumber(record.requiredTrips) ?? asNumber(record.tripTarget);
  if (!id || !title || requiredTrips == null || requiredTrips <= 0) {
    return null;
  }

  const claimRecord =
    asRecord(record.claim) ?? asRecord(record.latestClaim) ?? asRecord(record.myClaim);

  // Authoritative backend flag is `canClaim`.
  const eligible =
    asBool(record.canClaim, false) ||
    asBool(record.eligible, false) ||
    asBool(record.isEligible, false) ||
    asBool(claimRecord?.eligible, false);

  const claimStatus = normalizeClaimStatus(
    record.claimStatus ??
      record.status ??
      claimRecord?.status ??
      claimRecord?.claimStatus,
  );

  return {
    id,
    sortOrder: asInt(record.sortOrder, index + 1),
    title,
    requiredTrips: Math.floor(requiredTrips),
    windowMonths: asInt(record.windowMonths, 1),
    prizeValueCapInr: asInt(
      record.prizeValueCapInr ?? record.prizeValue ?? record.prizeCapInr,
      0,
    ),
    prizeDescription: asString(record.prizeDescription) ?? asString(record.prize),
    prizeImageUrl: asString(record.prizeImageUrl) ?? asString(record.prizeImage),
    qualifyingTrips:
      asNumber(record.tripCountInWindow) ??
      asNumber(record.qualifyingTrips) ??
      asNumber(record.completedTrips) ??
      asNumber(record.progressTrips) ??
      asNumber(record.tripCount) ??
      null,
    eligible,
    claimStatus,
    claimId:
      asString(record.claimId) ??
      asString(claimRecord?.id) ??
      asString(claimRecord?.claimId),
    claimedAt:
      asString(record.claimedAt) ??
      asString(claimRecord?.claimedAt) ??
      asString(claimRecord?.createdAt),
    remainingTrips: asNumber(record.remainingTrips),
    precedingClaimed: asBoolOrNull(record.precedingClaimed),
    thresholdMet: asBoolOrNull(record.thresholdMet),
    windowEndAt: asString(record.windowEndAt),
  };
};

const normalizeMilestones = (raw: unknown): CommuteRewardMilestoneDto[] => {
  const list =
    (Array.isArray(raw) && raw) ||
    (asRecord(raw) && Array.isArray(asRecord(raw)!.items) && asRecord(raw)!.items) ||
    [];
  return (list as unknown[])
    .map((item, index) => normalizeMilestone(item, index))
    .filter((item): item is CommuteRewardMilestoneDto => item != null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

const resolveIsActive = (nested: Record<string, unknown>): boolean => {
  if (typeof nested.isActive === 'boolean') {
    return nested.isActive;
  }
  const status = asString(nested.status)?.toUpperCase();
  if (status) {
    return status === 'ACTIVE';
  }
  return true;
};

export const normalizeCampaign = (raw: unknown): CommuteRewardCampaignDto | null => {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }
  const nested = asRecord(record.campaign) ?? record;
  const id = asString(nested.id) ?? asString(nested.campaignId);
  const title = asString(nested.title) ?? asString(nested.name);
  const startsAt = asString(nested.startsAt) ?? asString(nested.startAt);
  const endsAt = asString(nested.endsAt) ?? asString(nested.endAt);
  if (!id || !title || !startsAt || !endsAt) {
    return null;
  }

  const progress = asRecord(nested.progress) ?? asRecord(record.progress);
  // Prefer progress milestones (carry canClaim / tripCountInWindow) over shell list.
  const progressMilestones = progress?.milestones
    ? normalizeMilestones(progress.milestones)
    : [];
  const shellMilestones = normalizeMilestones(nested.milestones ?? record.milestones);
  const milestones =
    progressMilestones.length > 0
      ? mergeMilestoneLists(shellMilestones, progressMilestones)
      : shellMilestones;

  return {
    id,
    title,
    description: asString(nested.description),
    bannerUrl: asString(nested.bannerUrl) ?? asString(nested.banner),
    timezone: asString(nested.timezone) ?? 'Asia/Kolkata',
    startsAt,
    endsAt,
    isActive: resolveIsActive(nested),
    status: asString(nested.status),
    milestones,
    qualifyingTrips:
      asNumber(progress?.totalQualifyingTrips) ??
      asNumber(nested.totalQualifyingTrips) ??
      asNumber(nested.qualifyingTrips) ??
      asNumber(progress?.qualifyingTrips) ??
      asNumber(progress?.completedTrips) ??
      null,
  };
};

const mergeMilestoneLists = (
  shell: CommuteRewardMilestoneDto[],
  live: CommuteRewardMilestoneDto[],
): CommuteRewardMilestoneDto[] => {
  const byId = new Map(live.map((m) => [m.id, m]));
  const merged = shell.map((m) => {
    const progress = byId.get(m.id);
    if (!progress) {
      return m;
    }
    return {
      ...m,
      ...progress,
      // Keep shell title/prize if progress omitted them.
      title: progress.title || m.title,
      prizeDescription: progress.prizeDescription ?? m.prizeDescription,
      prizeImageUrl: progress.prizeImageUrl ?? m.prizeImageUrl,
      prizeValueCapInr:
        progress.prizeValueCapInr > 0 ? progress.prizeValueCapInr : m.prizeValueCapInr,
    };
  });
  for (const progress of live) {
    if (!merged.some((m) => m.id === progress.id)) {
      merged.push(progress);
    }
  }
  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
};

export const normalizeCampaignList = (payload: unknown): CommuteRewardCampaignDto[] => {
  const record = asRecord(payload);
  const listCandidate =
    (record && Array.isArray(record.items) && record.items) ||
    (record && Array.isArray(record.campaigns) && record.campaigns) ||
    (record && Array.isArray(record.data) && record.data) ||
    (record && Array.isArray(record.results) && record.results) ||
    (Array.isArray(payload) ? payload : []);

  return (listCandidate as unknown[])
    .map(normalizeCampaign)
    .filter((item): item is CommuteRewardCampaignDto => item != null);
};

export const normalizeProgress = (
  payload: unknown,
  campaignId: string,
): CommuteRewardProgressDto => {
  const record = asRecord(payload);
  const nested =
    asRecord(record?.progress) ??
    asRecord(record?.data) ??
    asRecord(record?.result) ??
    record;

  const milestones = normalizeMilestones(
    nested?.milestones ?? record?.milestones ?? payload,
  );

  return {
    campaignId: asString(nested?.campaignId) ?? campaignId,
    qualifyingTrips:
      asNumber(nested?.totalQualifyingTrips) ??
      asNumber(nested?.qualifyingTrips) ??
      asNumber(nested?.completedTrips) ??
      asNumber(nested?.tripCount) ??
      null,
    timezone: asString(nested?.timezone),
    milestones,
    raw: payload,
  };
};

export const mergeProgressIntoCampaign = (
  campaign: CommuteRewardCampaignDto,
  progress: CommuteRewardProgressDto,
): CommuteRewardCampaignDto => ({
  ...campaign,
  qualifyingTrips: progress.qualifyingTrips ?? campaign.qualifyingTrips,
  timezone: progress.timezone ?? campaign.timezone,
  milestones: mergeMilestoneLists(campaign.milestones, progress.milestones),
});

export const normalizeClaim = (raw: unknown): CommuteRewardClaimDto | null => {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }
  const nested = asRecord(record.claim) ?? record;
  const id = asString(nested.id) ?? asString(nested.claimId);
  const campaignId = asString(nested.campaignId);
  const milestoneId = asString(nested.milestoneId);
  if (!id || !campaignId || !milestoneId) {
    return null;
  }

  const prizeSnapshot = asRecord(nested.prizeSnapshot);

  return {
    id,
    campaignId,
    campaignTitle: asString(nested.campaignTitle) ?? asString(asRecord(nested.campaign)?.title),
    milestoneId,
    milestoneTitle:
      asString(nested.milestoneTitle) ??
      asString(prizeSnapshot?.title) ??
      asString(asRecord(nested.milestone)?.title),
    status: normalizeClaimStatus(nested.status ?? nested.claimStatus),
    prizeDescription:
      asString(nested.prizeDescriptionSnapshot) ??
      asString(nested.prizeDescription) ??
      asString(prizeSnapshot?.prizeDescription) ??
      asString(asRecord(nested.milestone)?.prizeDescription),
    prizeValueCapInr:
      asNumber(nested.prizeValueCapInrSnapshot) ??
      asNumber(nested.prizeValueCapInr) ??
      asNumber(prizeSnapshot?.prizeValueCapInr) ??
      asNumber(asRecord(nested.milestone)?.prizeValueCapInr),
    createdAt: asString(nested.claimedAt) ?? asString(nested.createdAt),
    updatedAt: asString(nested.updatedAt),
    reason:
      asString(nested.rejectionReason) ??
      asString(nested.reason) ??
      asString(nested.reviewReason),
  };
};

export const normalizeClaimPage = (
  payload: unknown,
  fallback: { page: number; limit: number },
): CommuteRewardClaimPageDto => {
  const record = asRecord(payload);
  const listCandidate =
    (record && Array.isArray(record.items) && record.items) ||
    (record && Array.isArray(record.claims) && record.claims) ||
    (record && Array.isArray(record.data) && record.data) ||
    (record && Array.isArray(record.results) && record.results) ||
    (Array.isArray(payload) ? payload : []);

  const items = (listCandidate as unknown[])
    .map(normalizeClaim)
    .filter((item): item is CommuteRewardClaimDto => item != null);

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

/** True when backend `canClaim` (mapped to eligible) allows a new claim. */
export const canClaimMilestone = (milestone: CommuteRewardMilestoneDto): boolean => {
  if (!milestone.eligible) {
    return false;
  }
  const status = String(milestone.claimStatus ?? '')
    .trim()
    .toUpperCase();
  if (
    status === 'UNDER_REVIEW' ||
    status === 'PENDING' ||
    status === 'APPROVED' ||
    status === 'FULFILLED' ||
    status === 'CLAIMED'
  ) {
    return false;
  }
  return true;
};
