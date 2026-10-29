import type { DriverEarningsDto, UserRatingsBlockDto } from '@/features/auth/types';

import type { DriverEarningBreakdown } from '../types';
import { formatCoinString, isZeroCoins } from './walletCoin';

export const formatOverallRatingLabel = (
  ratings: UserRatingsBlockDto | null | undefined,
): string => {
  const overall = ratings?.overall;
  if (!overall || overall.totalRatings <= 0) {
    return '—';
  }
  if (typeof overall.averageRating === 'number' && Number.isFinite(overall.averageRating)) {
    return overall.averageRating.toFixed(1);
  }
  return '—';
};

export interface DriverEarningsProfileView {
  driverEarningsLabel: string;
  earningBreakdown: readonly DriverEarningBreakdown[];
  earningInsight: string;
}

export const mapDriverEarningsToProfile = (
  earnings: DriverEarningsDto | null | undefined,
): DriverEarningsProfileView | null => {
  if (!earnings) {
    return null;
  }

  const earningBreakdown: DriverEarningBreakdown[] = [
    { label: 'Regular Rides', amountLabel: formatCoinString(earnings.regularTotalCoins) },
    { label: 'Assured Rides', amountLabel: formatCoinString(earnings.assuredTotalCoins) },
    { label: 'Office Commute', amountLabel: formatCoinString(earnings.commuteTotalCoins) },
  ];

  const insightParts: string[] = [];
  if (!isZeroCoins(earnings.assuredTotalCoins)) {
    insightParts.push(`${formatCoinString(earnings.assuredTotalCoins)} from Assured Rides`);
  }
  if (!isZeroCoins(earnings.commuteTotalCoins)) {
    insightParts.push(`${formatCoinString(earnings.commuteTotalCoins)} from Office Commute`);
  }

  return {
    driverEarningsLabel: formatCoinString(earnings.totalCoins),
    earningBreakdown,
    earningInsight:
      insightParts.length > 0 ? `You earned ${insightParts.join(' and ')}.` : '',
  };
};
