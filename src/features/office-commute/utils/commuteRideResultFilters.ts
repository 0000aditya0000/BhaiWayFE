import { departureTimeToMinutes } from '@/features/ride-search/constants/ride-result.constants';

import type {
  CommuteMatchFilterId,
  CommuteResultSortId,
  CommuteRideResultItem,
} from '../types/commute-ride-result.types';
import { matchesCommuteMatchFilter } from './routeMatchVisual';

export const sortCommuteRideResults = (
  rides: readonly CommuteRideResultItem[],
  sortId: CommuteResultSortId,
): CommuteRideResultItem[] => {
  const next = [...rides];

  switch (sortId) {
    case 'price-asc':
      return next.sort((a, b) => a.price - b.price);
    case 'departure':
      return next.sort(
        (a, b) =>
          departureTimeToMinutes(a.departureTime) - departureTimeToMinutes(b.departureTime),
      );
    case 'match-desc':
    default:
      return next.sort((a, b) => {
        const aMatch = a.matchPercent ?? -1;
        const bMatch = b.matchPercent ?? -1;
        if (bMatch !== aMatch) {
          return bMatch - aMatch;
        }
        return a.price - b.price;
      });
  }
};

export const filterCommuteRideResults = (
  rides: readonly CommuteRideResultItem[],
  matchFilterId: CommuteMatchFilterId,
): CommuteRideResultItem[] =>
  rides.filter((ride) => matchesCommuteMatchFilter(ride.matchPercent, matchFilterId));
