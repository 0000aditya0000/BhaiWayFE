import { ROUTES } from '@/config';

import type { RatingsSubmittedItem, RatingsSubmittedSummary } from '../types';

export const RATINGS_SUBMITTED_SCREEN = {
  headerTitle: 'Submission Status',
  titleLine1: 'Ratings',
  titleLine2: 'Submitted!',
  subtitle:
    'Thank you for rating your passengers. Your feedback helps maintain our high-trust community and professional standards.',
  summaryLabel: 'Summary',
  ratedCountLabel: (count: number) =>
    `${count} Passenger${count === 1 ? '' : 's'} Rated`,
  verifiedLabel: 'Verified',
  dashboardLabel: 'Back to Dashboard',
  supportPrompt: 'Need to change something?',
  supportLinkLabel: 'Contact Support',
  supportTitle: 'Contact Support',
  supportMessage: 'Support chat will be available soon.',
} as const;

const DEFAULT_ITEMS: readonly RatingsSubmittedItem[] = [];

export const getRatingsSubmittedMock = (params?: {
  rideId?: string;
  items?: readonly RatingsSubmittedItem[];
}): RatingsSubmittedSummary => {
  const items = params?.items ?? DEFAULT_ITEMS;
  return {
    rideId: params?.rideId || '',
    ratedCount: items.length,
    items,
  };
};

export const getRatingsSubmittedPath = (params: {
  rideId: string;
  items: readonly RatingsSubmittedItem[];
}) => ({
  pathname: ROUTES.myRidesRatingsSubmitted,
  params: {
    rideId: params.rideId,
    items: JSON.stringify(params.items),
  },
});
