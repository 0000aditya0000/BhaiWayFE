import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const CARD_BORDER = 'rgba(198, 198, 205, 0.3)';
const ROW_DIVIDER = 'rgba(198, 198, 205, 0.2)';

export const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#5C5F61',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 20, offsetY: 4, elevation: 2 }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 72,
  },
  rowDivider: {
    height: 1,
    backgroundColor: ROW_DIVIDER,
    marginLeft: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: layout.radiusMd,
    backgroundColor: '#DCE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaBadge: {
    width: 40,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#1A1F71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaText: {
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    color: colors.white,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#191C1D',
  },
  labelMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: '#191C1D',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5C5F61',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceValue: {
    fontWeight: '600',
    color: colors.primary,
  },
  sufficientHint: {
    fontSize: 12,
    lineHeight: 16,
    color: '#5C5F61',
    marginTop: 2,
  },
  insufficientHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.error,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#76777D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  banksGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ROW_DIVIDER,
  },
  bankItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRightWidth: 1,
    borderRightColor: 'rgba(198, 198, 205, 0.1)',
  },
  bankItemLast: {
    borderRightWidth: 0,
  },
  bankItemSelected: {
    backgroundColor: '#EFF4FF',
  },
  bankIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.24,
    textAlign: 'center',
    color: '#191C1D',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 52,
  },
  seeAllLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: '#45464D',
  },
});
