import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(55, 75, 177, 0.32)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
    ...createShadow({ color: colors.primary, opacity: 0.14, radius: 20, offsetY: -4, elevation: 12 }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentLight,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 18,
    color: colors.primary,
  },
  headerCopy: {
    flex: 1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthTitle: {
    ...typography.label,
    fontSize: 16,
    color: colors.textPrimary,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayLabel: {
    ...typography.label,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dayLabelMuted: {
    color: colors.disabled,
  },
  dayLabelSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  timeHero: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: layout.radiusXl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timePreview: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  periodChip: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  periodLabelSelected: {
    color: colors.white,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepperCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: layout.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperCaption: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stepperValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: layout.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceMuted,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  confirmLabel: {
    ...typography.label,
    color: colors.white,
    fontWeight: '700',
  },
});
