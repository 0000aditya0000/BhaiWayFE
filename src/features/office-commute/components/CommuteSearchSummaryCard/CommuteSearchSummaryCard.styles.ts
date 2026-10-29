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
  accent: {
    height: 4,
    backgroundColor: colors.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  routeLabel: {
    ...typography.label,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  editLabel: {
    ...typography.label,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
