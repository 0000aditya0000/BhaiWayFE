import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const rowTokens = {
  PRIMARY: '#374BB1',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE_LOWEST: '#FFFFFF',
  CREDIT: '#16A34A',
  CREDIT_SOFT: '#DCFCE7',
  CREDIT_ICON: '#15803D',
  DEBIT: '#BA1A1A',
  DEBIT_SOFT: 'rgba(186, 26, 26, 0.12)',
  PRIMARY_SOFT: 'rgba(55, 75, 177, 0.12)',
  NEUTRAL_SOFT: '#E7E8E9',
  NEUTRAL_ICON: '#434655',
  COIN_GOLD: '#C9A227',
} as const;

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: rowTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    overflow: 'hidden',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 3, elevation: 2 }),
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: rowTokens.ON_SURFACE,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: rowTokens.PRIMARY,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
    color: rowTokens.ON_SURFACE_VARIANT,
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountCredit: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: rowTokens.CREDIT,
  },
  amountDebit: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: rowTokens.DEBIT,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: rowTokens.PRIMARY_SOFT,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: rowTokens.PRIMARY,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(196, 197, 215, 0.45)',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: rowTokens.PRIMARY,
  },
});
