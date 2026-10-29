import type { ReferralPerk } from '../types';

export const REFER_EARN_SCREEN = {
  title: 'Referrals & Rewards',
  tabReferrals: 'Referrals',
  tabRewards: 'Rewards',
  heroTitle: 'Invite friends to BhaiWay',
  heroSubtitle: 'Share your code — you both get 50 BhaiWay Coins when they join.',
  exclusiveLabel: 'Your referral code',
  shareCodeTitle: 'Share & earn',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  copySuccessTitle: 'Copied',
  copySuccessMessage: 'Referral code copied',
  shareLabel: 'Share invite',
  shareFailedTitle: 'Unable to share',
  shareFailedMessage: 'Unable to share right now. Please try again.',
  statsReferralsLabel: 'Referrals',
  statsCoinsLabel: 'Coins earned',
  statusTitle: 'Referral activity',
  emptyTitle: 'No referrals yet',
  emptySubtitle: 'Invite friends and earn 50 Coins when they join BhaiWay.',
  inviteLabel: 'Invite friends',
  loadingLabel: 'Loading referrals…',
  retryLabel: 'Retry',
  helpTitle: 'Referrals & Rewards',
  helpMessage:
    'Share your referral code with friends. When they register with your code, you both receive 50 promotional BhaiWay Coins. Driver reward campaigns for Office Commute appear on the Rewards tab.',
  rewardsHelpTitle: 'Driver Rewards',
  rewardsHelpMessage:
    'Complete qualifying Office Commute trips to unlock campaign milestones. Claim prizes from active campaigns and track status in claim history.',
  shareMessage: (code: string) =>
    [
      'Join me on BhaiWay!',
      '',
      `Use my referral code ${code} when you register and we both get 50 BhaiWay Coins.`,
      '',
      'Happy riding with BhaiWay!',
    ].join('\n'),
} as const;

/** Signup phone screen — optional referral field. */
export const REFERRAL_CODE_FIELD = {
  label: 'Have a referral code?',
  placeholder: 'Enter referral code',
  hint: 'Optional',
  invalid: 'Please check your referral code.',
} as const;

export const REFERRAL_PERKS: readonly ReferralPerk[] = [
  { id: 'coins', label: '50 Coins each', icon: 'gift-outline', tone: 'primary' },
  { id: 'unlimited', label: 'Unlimited referrals', icon: 'people-outline', tone: 'neutral' },
] as const;

export const REFERRAL_STATUS_LABEL = {
  REWARDED: 'Rewarded',
} as const;

/** @deprecated Demo constant removed — use GET /referrals/summary. */
export const REFERRAL_CODE = '';

/** @deprecated Demo history removed — use GET /referrals. */
export const REFERRAL_HISTORY = [] as const;
