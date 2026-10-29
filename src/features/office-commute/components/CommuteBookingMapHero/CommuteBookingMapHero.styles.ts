import { StyleSheet } from 'react-native';

import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    overflow: 'hidden',
    ...createShadow({ opacity: 0.06, radius: 14, offsetY: 6, elevation: 3 }),
  },
  mapWrap: {
    height: 200,
    width: '100%',
    backgroundColor: colors.accentLight,
    position: 'relative',
  },
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statCol: {
    flex: 1,
    gap: 2,
  },
  statCenter: {
    alignItems: 'center',
  },
  statEnd: {
    alignItems: 'flex-end',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  statValue: {
    ...typography.label,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.divider,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  matchBadgeText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  matchCaption: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
});
