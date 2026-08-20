import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
  },
  intro: {
    marginBottom: spacing.sectionGap,
  },
  searchCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radiusXl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.cardGap,
    ...createShadow({
      color: colors.primary,
      opacity: 0.08,
      radius: 14,
      offsetY: 4,
      elevation: 3,
    }),
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCopy: {
    flex: 1,
    gap: 4,
  },
  checkboxLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: 15,
  },
  checkboxHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  officeSearchButton: {
    backgroundColor: '#4B61C4',
  },
});
