import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';

export const detailTokens = {
  PRIMARY: '#374BB1',
  ON_PRIMARY: '#FFFFFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_LOWEST: '#FFFFFF',
  CREDIT: '#16A34A',
  CREDIT_SOFT: '#DCFCE7',
  DEBIT: '#BA1A1A',
  DEBIT_SOFT: 'rgba(186, 26, 26, 0.12)',
  COIN_GOLD: '#C9A227',
  OVERLAY: 'rgba(15, 23, 42, 0.45)',
} as const;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: detailTokens.OVERLAY,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: detailTokens.SURFACE_LOWEST,
    borderTopLeftRadius: layout.radiusXl,
    borderTopRightRadius: layout.radiusXl,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: detailTokens.OUTLINE_VARIANT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: detailTokens.ON_SURFACE,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: detailTokens.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: layout.radiusLg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroCredit: {
    backgroundColor: detailTokens.CREDIT_SOFT,
  },
  heroDebit: {
    backgroundColor: detailTokens.DEBIT_SOFT,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: detailTokens.SURFACE_LOWEST,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: detailTokens.ON_SURFACE,
    textAlign: 'center',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroAmountCredit: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: detailTokens.CREDIT,
  },
  heroAmountDebit: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: detailTokens.DEBIT,
  },
  heroDate: {
    fontSize: 13,
    color: detailTokens.ON_SURFACE_VARIANT,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.huge,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(196, 197, 215, 0.5)',
  },
  rowLabel: {
    flex: 0.42,
    fontSize: 13,
    lineHeight: 18,
    color: detailTokens.ON_SURFACE_VARIANT,
  },
  rowValue: {
    flex: 0.58,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: detailTokens.ON_SURFACE,
    textAlign: 'right',
  },
  rowValueMono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
