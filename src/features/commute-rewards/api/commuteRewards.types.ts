/**
 * Office Commute driver rewards — mobile UI models.
 * API boundary preserves backend field names; normalizers map into these DTOs.
 */

export type CommuteRewardClaimStatus =
  | 'NONE'
  | 'UNDER_REVIEW'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'FULFILLED'
  | 'CLAIMED'
  | string;

export interface CommuteRewardMilestoneDto {
  id: string;
  sortOrder: number;
  title: string;
  requiredTrips: number;
  windowMonths: number;
  prizeValueCapInr: number;
  prizeDescription: string | null;
  prizeImageUrl: string | null;
  /**
   * Qualifying trips in the milestone window.
   * Source: backend `tripCountInWindow` (progress) or legacy aliases.
   */
  qualifyingTrips: number | null;
  /**
   * Server-reported claim eligibility.
   * Source: backend `canClaim` (authoritative).
   */
  eligible: boolean;
  claimStatus: CommuteRewardClaimStatus;
  claimId: string | null;
  claimedAt: string | null;
  /** Remaining trips to threshold when backend sends `remainingTrips`. */
  remainingTrips: number | null;
  precedingClaimed: boolean | null;
  thresholdMet: boolean | null;
  windowEndAt: string | null;
}

export interface CommuteRewardCampaignDto {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  timezone: string;
  startsAt: string;
  endsAt: string;
  /** Derived from backend `status === 'ACTIVE'` when `isActive` is absent. */
  isActive: boolean;
  status: string | null;
  milestones: CommuteRewardMilestoneDto[];
  /**
   * Campaign-level qualifying trip total.
   * Source: backend `totalQualifyingTrips` on nested progress.
   */
  qualifyingTrips: number | null;
}

export interface CommuteRewardProgressDto {
  campaignId: string;
  qualifyingTrips: number | null;
  timezone: string | null;
  milestones: CommuteRewardMilestoneDto[];
  raw: unknown;
}

export interface CommuteRewardClaimDto {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  milestoneId: string;
  milestoneTitle: string | null;
  status: CommuteRewardClaimStatus;
  prizeDescription: string | null;
  prizeValueCapInr: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  reason: string | null;
}

export interface CommuteRewardClaimPageDto {
  items: CommuteRewardClaimDto[];
  page: number;
  limit: number;
  total: number | null;
}
