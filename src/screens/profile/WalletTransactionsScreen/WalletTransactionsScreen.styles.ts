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
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: walletTxTokens.SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
    backgroundColor: walletTxTokens.SURFACE_LOWEST,
    ...createShadow({ color: '#000000', opacity: 0.05, radius: 12, offsetY: 2, elevation: 2 }),
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    flex: 1,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: walletTxTokens.PRIMARY,
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
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: walletTxTokens.SURFACE_HIGH,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: walletTxTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    ...createShadow({ color: '#000000', opacity: 0.05, radius: 16, offsetY: 4, elevation: 2 }),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
    paddingRight: spacing.md,
  },
  iconDebit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: walletTxTokens.ERROR_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCredit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: walletTxTokens.CREDIT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: walletTxTokens.ON_SURFACE,
  },
  date: {
    fontSize: 14,
    lineHeight: 20,
    color: walletTxTokens.ON_SURFACE_VARIANT,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountDebit: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: walletTxTokens.ERROR,
  },
  amountCredit: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: walletTxTokens.CREDIT,
  },
  typeLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: walletTxTokens.OUTLINE,
    textTransform: 'capitalize',
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
});
