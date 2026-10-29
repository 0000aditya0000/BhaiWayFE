/** Backend ReferralStatus — OpenAPI currently documents REWARDED only. */
export type ReferralStatus = 'REWARDED' | string;

export interface ReferralReferredUserDto {
  id: string;
  name: string | null;
  profilePhoto: string | null;
}

export interface ReferralListItemDto {
  id: string;
  referredUser: ReferralReferredUserDto;
  rewardCoins: string;
  status: ReferralStatus;
  createdAt: string;
  rewardedAt?: string | null;
}

/** GET /referrals/summary — ReferralSummaryDto */
export interface ReferralSummaryDto {
  referralCode: string;
  totalReferrals: number;
  /** Promotional Coins earned as referrer (integer string). */
  totalCoinsEarned: string;
}

/** GET /referrals — ReferralPageDto (no totalPages in OpenAPI). */
export interface ReferralPageDto {
  items: ReferralListItemDto[];
  page: number;
  limit: number;
  total: number;
}

export interface ListReferralsQuery {
  page?: number;
  limit?: number;
}
