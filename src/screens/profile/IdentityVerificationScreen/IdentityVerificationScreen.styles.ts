import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const identityTokens = {
  PRIMARY: '#374BB1',
  PRIMARY_FIXED: '#DDE1FF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_LOWEST: '#FFFFFF',
  SUCCESS: '#2E7D32',
  SUCCESS_SOFT: '#E8F5E9',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: identityTokens.SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: identityTokens.SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: identityTokens.OUTLINE_VARIANT,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: identityTokens.PRIMARY,
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
  introCard: {
    backgroundColor: identityTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    gap: spacing.sm,
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  introTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: identityTokens.ON_SURFACE,
  },
  introBody: {
    fontSize: 14,
    lineHeight: 20,
    color: identityTokens.ON_SURFACE_VARIANT,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: identityTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  methodCardPressed: {
    opacity: 0.92,
  },
  methodIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: identityTokens.PRIMARY_FIXED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    flex: 1,
    gap: spacing.xs,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: identityTokens.ON_SURFACE,
  },
  methodSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: identityTokens.ON_SURFACE_VARIANT,
  },
  methodCta: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: identityTokens.PRIMARY,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: identityTokens.SUCCESS_SOFT,
    borderRadius: layout.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  verifiedLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: identityTokens.SUCCESS,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
