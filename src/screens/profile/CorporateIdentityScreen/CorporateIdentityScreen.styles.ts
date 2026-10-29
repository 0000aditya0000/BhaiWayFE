import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const corporateIdentityTokens = {
  PRIMARY: '#374BB1',
  PRIMARY_FIXED: '#DDE1FF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_LOW: '#F3F4F5',
  SURFACE_LOWEST: '#FFFFFF',
  SUCCESS: '#1B8F4E',
  SUCCESS_SOFT: '#E8F7EE',
  WARNING: '#B86E00',
  WARNING_SOFT: '#FFF4E5',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: corporateIdentityTokens.SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: corporateIdentityTokens.SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: corporateIdentityTokens.OUTLINE_VARIANT,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: corporateIdentityTokens.PRIMARY,
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
  card: {
    backgroundColor: corporateIdentityTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    gap: spacing.lg,
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: corporateIdentityTokens.PRIMARY_FIXED,
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
    color: corporateIdentityTokens.ON_SURFACE,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: corporateIdentityTokens.ON_SURFACE_VARIANT,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: layout.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusNeutral: {
    backgroundColor: corporateIdentityTokens.SURFACE_LOW,
  },
  statusWarning: {
    backgroundColor: corporateIdentityTokens.WARNING_SOFT,
  },
  statusSuccess: {
    backgroundColor: corporateIdentityTokens.SUCCESS_SOFT,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  statusTextNeutral: {
    color: corporateIdentityTokens.ON_SURFACE_VARIANT,
  },
  statusTextWarning: {
    color: corporateIdentityTokens.WARNING,
  },
  statusTextSuccess: {
    color: corporateIdentityTokens.SUCCESS,
  },
  emailBlock: {
    backgroundColor: corporateIdentityTokens.SURFACE_LOW,
    borderRadius: layout.radiusLg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emailLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: corporateIdentityTokens.ON_SURFACE_VARIANT,
  },
  emailValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: corporateIdentityTokens.ON_SURFACE,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: corporateIdentityTokens.ON_SURFACE_VARIANT,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: corporateIdentityTokens.WARNING,
  },
});
