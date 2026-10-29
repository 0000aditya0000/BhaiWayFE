export type ReferralStatus = 'REWARDED' | string;

export interface ReferralPerk {
  id: string;
  label: string;
  icon: 'gift-outline' | 'people-outline' | 'flame-outline';
  tone: 'primary' | 'neutral';
}

/** @deprecated Prefer ReferralListItemUi from referrals.mapper. */
export interface ReferralHistoryItem {
  id: string;
  name: string;
  detail: string;
  amountLabel: string;
  status: ReferralStatus;
}
