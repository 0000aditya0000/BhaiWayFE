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
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radiusMd,
    padding: spacing.md,
  },
  seatLabel: {
    ...typography.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  seatControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  seatButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ opacity: 0.08, radius: 6, offsetY: 2, elevation: 2 }),
  },
  seatButtonLabel: {
    ...typography.label,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  seatValue: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  seatHint: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  fareCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radiusMd,
    padding: spacing.md,
    gap: spacing.md,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareLabel: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  fareValue: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  totalLabel: {
    ...typography.label,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    ...typography.title,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.primary,
  },
  payNowNote: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
