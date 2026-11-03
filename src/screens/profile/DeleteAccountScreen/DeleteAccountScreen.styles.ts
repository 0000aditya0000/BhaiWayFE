import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const deleteAccountTokens = {
  PRIMARY: '#374BB1',
  PRIMARY_DISABLED: '#A4AFD6',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE: '#747686',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_LOW: '#F3F4F5',
  ERROR: '#BA1A1A',
  ERROR_SOFT: 'rgba(255, 218, 214, 0.3)',
  ERROR_BORDER: 'rgba(186, 26, 26, 0.1)',
  SELECTED_BG: 'rgba(55, 75, 177, 0.05)',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: deleteAccountTokens.SURFACE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 56,
    backgroundColor: deleteAccountTokens.SURFACE,
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 8, offsetY: 2, elevation: 2 }),
  },
  headerLeft: {
    width: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerRight: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: deleteAccountTokens.ON_SURFACE,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge + spacing.xxxl,
    gap: spacing.xl,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  introBlock: {
    gap: spacing.xs,
  },
  pageTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: deleteAccountTokens.ON_SURFACE,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: deleteAccountTokens.ON_SURFACE_VARIANT,
  },
  feedbackSection: {
    gap: spacing.lg,
  },
  reasonsHeading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: deleteAccountTokens.ON_SURFACE,
  },
  reasonsList: {
    gap: spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: layout.radiusLg,
    borderWidth: 1.5,
    borderColor: deleteAccountTokens.OUTLINE_VARIANT,
  },
  reasonRowSelected: {
    borderColor: deleteAccountTokens.PRIMARY,
    backgroundColor: deleteAccountTokens.SELECTED_BG,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: deleteAccountTokens.ON_SURFACE,
  },
  reasonLabelSelected: {
    fontWeight: '600',
    color: deleteAccountTokens.PRIMARY,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: deleteAccountTokens.OUTLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: deleteAccountTokens.PRIMARY,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: deleteAccountTokens.PRIMARY,
  },
  feedbackBlock: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  feedbackLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: deleteAccountTokens.ON_SURFACE_VARIANT,
  },
  feedbackInput: {
    minHeight: 100,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: deleteAccountTokens.OUTLINE_VARIANT,
    borderRadius: layout.radiusLg,
    fontSize: 15,
    lineHeight: 22,
    color: deleteAccountTokens.ON_SURFACE,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    lineHeight: 16,
    color: deleteAccountTokens.OUTLINE,
    textAlign: 'right',
  },
  actions: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  continueButton: {
    height: 52,
    borderRadius: layout.radiusLg,
    backgroundColor: deleteAccountTokens.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.shadow, opacity: 0.12, radius: 8, offsetY: 3, elevation: 3 }),
  },
  continueButtonDisabled: {
    backgroundColor: deleteAccountTokens.PRIMARY_DISABLED,
    elevation: 0,
    shadowOpacity: 0,
  },
  continueLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.white,
  },
});
