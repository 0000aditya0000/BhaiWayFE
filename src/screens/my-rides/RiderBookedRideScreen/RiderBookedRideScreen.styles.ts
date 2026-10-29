import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const riderStyles = StyleSheet.create({
  routeCardBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  routeTimelineWrap: {
    flex: 1,
    minWidth: 0,
  },
  routeOtpBlock: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 104,
    maxWidth: 120,
    ...createShadow({
      color: colors.primary,
      opacity: 0.12,
      radius: 8,
      offsetY: 4,
      elevation: 3,
    }),
  },
  routeOtpLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 6,
  },
  routeOtpValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 5,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  routeOtpHint: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  preferencesCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  preferencesList: {
    gap: spacing.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preferenceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  preferencesEmpty: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  womenOnlyChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FCE7F3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  womenOnlyChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#9D174D',
  },
});
