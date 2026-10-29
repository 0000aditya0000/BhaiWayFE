import { colors } from '@/theme/colorTheme';

import type { CommuteMatchFilterId } from '../types/commute-ride-result.types';

export type RouteMatchTier = 'high' | 'medium' | 'low';

export interface RouteMatchVisualStyle {
  backgroundColor: string;
  textColor: string;
  iconColor: string;
}

const ROUTE_MATCH_TIER_STYLES: Record<RouteMatchTier, RouteMatchVisualStyle> = {
  high: {
    backgroundColor: colors.successSoft,
    textColor: colors.successDark,
    iconColor: colors.successDark,
  },
  medium: {
    backgroundColor: colors.warningSoft,
    textColor: colors.warningDark,
    iconColor: colors.warning,
  },
  low: {
    backgroundColor: '#FEE2E2',
    textColor: colors.error,
    iconColor: colors.error,
  },
};

/** ≥80% green, 60–79% yellow, <60% red. */
export const getRouteMatchTier = (percent: number): RouteMatchTier => {
  if (percent >= 80) {
    return 'high';
  }
  if (percent >= 60) {
    return 'medium';
  }
  return 'low';
};

export const getRouteMatchVisual = (percent: number): RouteMatchVisualStyle =>
  ROUTE_MATCH_TIER_STYLES[getRouteMatchTier(percent)];

export const matchesCommuteMatchFilter = (
  matchPercent: number | null | undefined,
  filterId: CommuteMatchFilterId,
): boolean => {
  if (filterId === 'all') {
    return true;
  }
  if (matchPercent == null || !Number.isFinite(matchPercent)) {
    return false;
  }
  const tier = getRouteMatchTier(matchPercent);
  return tier === filterId;
};
