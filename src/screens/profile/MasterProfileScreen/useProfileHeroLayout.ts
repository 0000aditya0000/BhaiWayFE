import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@/shared/theme';

const HEADER_FALLBACK_HEIGHT = layout.minTouchTarget;

export interface ProfileHeroLayoutMetrics {
  avatarOuterSize: number;
  avatarRingRadius: number;
  avatarInnerRadius: number;
  avatarRise: number;
  cardOverlap: number;
  cardPaddingTop: number;
  heroTailSpacer: number;
  gradientMinHeight: number;
  headerPaddingTop: number;
  onHeaderLayout: (height: number) => void;
}

/**
 * Responsive profile hero metrics derived from safe-area, screen width, and
 * measured header height — avoids hard-coded overlap values that break on iOS.
 */
export const useProfileHeroLayout = (): ProfileHeroLayoutMetrics => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [headerBarHeight, setHeaderBarHeight] = useState(0);

  const onHeaderLayout = useCallback((height: number) => {
    setHeaderBarHeight((prev) => (Math.abs(prev - height) < 0.5 ? prev : height));
  }, []);

  return useMemo(() => {
    const resolvedHeaderBar = headerBarHeight > 0 ? headerBarHeight : HEADER_FALLBACK_HEIGHT;
    const headerZoneHeight = insets.top + resolvedHeaderBar + spacing.sm;

    const avatarOuterSize = Math.min(
      Math.round(windowWidth * 0.27),
      Math.round(layout.avatarSize * 0.9),
    );
    const avatarRise = Math.round(avatarOuterSize * 0.4);
    const cardOverlap = Math.round(avatarOuterSize * 0.18);
    const cardPaddingTop = Math.round(avatarOuterSize * 0.55) + spacing.md;
    const heroTailSpacer = avatarRise + cardOverlap + spacing.lg;

    return {
      avatarOuterSize,
      avatarRingRadius: avatarOuterSize / 2,
      avatarInnerRadius: (avatarOuterSize - 6) / 2,
      avatarRise,
      cardOverlap,
      cardPaddingTop,
      heroTailSpacer,
      gradientMinHeight: headerZoneHeight + heroTailSpacer,
      headerPaddingTop: insets.top,
      onHeaderLayout,
    };
  }, [headerBarHeight, insets.top, onHeaderLayout, windowWidth]);
};
