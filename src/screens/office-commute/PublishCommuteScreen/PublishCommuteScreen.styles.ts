import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';
import { androidTextInputFix } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  intro: {
    marginBottom: spacing.xl,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  pressableField: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.radiusMd,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: layout.inputHeight,
    justifyContent: 'center',
  },
  pressableFieldActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldLabelActive: {
    color: colors.primary,
  },
  fieldValue: {
    ...typography.input,
    fontSize: 15,
    color: colors.textPrimary,
  },
  fieldPlaceholder: {
    color: colors.textPlaceholder,
  },
  fieldIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  dayChip: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayLabel: {
    ...typography.label,
    fontSize: 12,
    color: colors.textSecondary,
  },
  dayLabelSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  optionalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  optionalText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  priceInput: {
    ...typography.input,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
    flex: 1,
    ...androidTextInputFix,
  },
  earningsBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radiusMd,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  earningsText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  earningsValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
