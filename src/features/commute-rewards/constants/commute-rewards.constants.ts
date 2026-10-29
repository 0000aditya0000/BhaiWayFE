export const COMMUTE_REWARDS_LIST_SCREEN = {
  title: 'Driver Rewards',
  subtitle: 'Complete qualifying Office Commute trips to unlock prizes.',
  emptyTitle: 'No active rewards',
  emptyBody: 'There are no active Office Commute reward campaigns right now. Check back soon.',
  loadErrorTitle: 'Unable to load rewards',
  loadErrorBody: 'Could not load reward campaigns. Check your connection and try again.',
  retryLabel: 'Retry',
  claimsCta: 'Claim history',
  viewMilestonesCta: 'View milestones',
  offlineTitle: 'You are offline',
  offlineBody: 'Connect to the internet to view reward campaigns.',
} as const;

export const COMMUTE_REWARDS_DETAIL_SCREEN = {
  title: 'Campaign',
  milestonesTitle: 'Milestones',
  timezoneLabel: 'Timezone',
  datesLabel: 'Campaign dates',
  prizeCapLabel: (inr: number) => `Prize worth up to ₹${inr.toLocaleString('en-IN')}`,
  tripsProgress: (current: number | null, required: number) =>
    current == null
      ? `Target: ${required} qualifying trips`
      : `${current} / ${required} qualifying trips`,
  windowLabel: (months: number) =>
    months === 1 ? 'Qualifying window: 1 calendar month' : `Qualifying window: ${months} months`,
  eligibleLabel: 'Eligible to claim',
  notEligibleLabel: 'Not eligible yet',
  claimLabel: 'Claim reward',
  claimingLabel: 'Submitting…',
  claimedLabel: 'Claim submitted',
  claimSuccessTitle: 'Claim submitted',
  claimSuccessBody: 'Your reward claim was submitted. Status updates appear in claim history.',
  claimErrorTitle: 'Unable to claim',
  loadErrorTitle: 'Unable to load campaign',
  loadErrorBody: 'Could not load this campaign. Please try again.',
  retryLabel: 'Retry',
  emptyMilestones: 'No milestones configured for this campaign.',
} as const;

export const COMMUTE_REWARDS_CLAIMS_SCREEN = {
  title: 'Claim history',
  emptyTitle: 'No claims yet',
  emptyBody: 'When you claim a milestone reward, it will show up here.',
  loadErrorTitle: 'Unable to load claims',
  loadErrorBody: 'Could not load your claim history. Please try again.',
  retryLabel: 'Retry',
} as const;

export const formatClaimStatusLabel = (status: string): string => {
  const key = String(status ?? '')
    .trim()
    .toUpperCase();
  switch (key) {
    case 'UNDER_REVIEW':
    case 'PENDING':
      return 'Under review';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'FULFILLED':
    case 'CLAIMED':
      return 'Fulfilled';
    case 'NONE':
      return 'Not claimed';
    default:
      return key || 'Unknown';
  }
};
