import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const walletTxTokens = {
  PRIMARY: '#374BB1',
  ON_PRIMARY: '#FFFFFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE: '#747686',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_HIGH: '#E7E8E9',
  SURFACE_LOWEST: '#FFFFFF',
  ERROR: '#BA1A1A',
  ERROR_SOFT: 'rgba(186, 26, 26, 0.12)',
  CREDIT: '#16A34A',
  CREDIT_SOFT: '#DCFCE7',
  CREDIT_ICON: '#15803D',
  PRIMARY_SOFT: 'rgba(55, 75, 177, 0.12)',
  NEUTRAL_SOFT: '#E7E8E9',
  NEUTRAL_ICON: '#434655',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: walletTxTokens.SURFACE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    backgroundColor: walletTxTokens.SURFACE_LOWEST,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(196, 197, 215, 0.5)',
  },
  headerSide: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: walletTxTokens.ON_SURFACE,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge + spacing.xxxl,
    gap: spacing.cardGap,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: walletTxTokens.ON_SURFACE_VARIANT,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: walletTxTokens.SURFACE_LOWEST,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.5)',
  },
  filterChipActive: {
    backgroundColor: walletTxTokens.PRIMARY,
  },
  filterLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: walletTxTokens.ON_SURFACE_VARIANT,
  },
  filterLabelActive: {
    color: walletTxTokens.ON_PRIMARY,
  },
  list: {
    gap: spacing.md,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    color: walletTxTokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: walletTxTokens.ON_SURFACE,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: walletTxTokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: layout.radiusMd,
    backgroundColor: walletTxTokens.PRIMARY,
  },
  retryLabel: {
    color: walletTxTokens.ON_PRIMARY,
    fontWeight: '700',
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.lg,
  },
  loadMoreLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: walletTxTokens.PRIMARY,
  },
});
