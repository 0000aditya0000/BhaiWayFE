import { StyleSheet } from 'react-native';

import { colors, layout, spacing, typography } from '@/shared/theme';

export const editProfileTokens = {
  PRIMARY: '#374BB1',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE: '#747686',
  SURFACE: '#F8F9FA',
} as const;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: editProfileTokens.SURFACE,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
  },
  genderLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  error: {
    marginTop: spacing.sm,
    color: colors.error,
    ...typography.caption,
  },
  phoneBlock: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  phoneHint: {
    ...typography.caption,
    color: editProfileTokens.ON_SURFACE_VARIANT,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: editProfileTokens.SURFACE,
  },
});
