import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const emailVerifyTokens = {
  PRIMARY: '#374BB1',
  PRIMARY_CONTAINER: '#4B61C4',
  PRIMARY_FIXED: '#DDE1FF',
  ON_PRIMARY_CONTAINER: '#EAEBFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_LOWEST: '#FFFFFF',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: emailVerifyTokens.SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: emailVerifyTokens.SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: emailVerifyTokens.OUTLINE_VARIANT,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: emailVerifyTokens.PRIMARY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.huge + spacing.xxxl,
    gap: spacing.cardGap,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: emailVerifyTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: emailVerifyTokens.PRIMARY_FIXED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: emailVerifyTokens.ON_SURFACE,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: emailVerifyTokens.ON_SURFACE_VARIANT,
  },
  otpCard: {
    backgroundColor: emailVerifyTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: emailVerifyTokens.PRIMARY,
  },
  resendDisabled: {
    color: emailVerifyTokens.ON_SURFACE_VARIANT,
    opacity: 0.7,
  },
});
