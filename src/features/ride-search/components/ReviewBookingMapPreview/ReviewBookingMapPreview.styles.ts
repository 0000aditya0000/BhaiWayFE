import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  container: {
    height: 192,
    borderRadius: layout.radiusXl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#DCE9FF',
    ...createShadow({ color: colors.shadow, opacity: 0.06, radius: 8, offsetY: 2, elevation: 2 }),
  },
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  badge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusMd,
    ...createShadow({ color: colors.shadow, opacity: 0.08, radius: 6, offsetY: 2, elevation: 2 }),
  },
  badgeText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
