import type { UserRatingItem } from '../api/ratings.types';

export interface UserRatingsSummary {
  average: number;
  count: number;
  averageLabel: string;
}

export const computeUserRatingsSummary = (
  ratings: readonly UserRatingItem[],
): UserRatingsSummary => {
  if (ratings.length === 0) {
    return {
      average: 0,
      count: 0,
      averageLabel: '—',
    };
  }

  const total = ratings.reduce((sum, item) => sum + item.rating, 0);
  const average = total / ratings.length;

  return {
    average,
    count: ratings.length,
    averageLabel: average.toFixed(1),
  };
};
