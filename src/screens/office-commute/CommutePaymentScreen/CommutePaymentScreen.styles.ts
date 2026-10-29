import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6CD',
    backgroundColor: '#F8F9FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.cardGap,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  secureText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#5C5F61',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.04,
      radius: 20,
      offsetY: -4,
      elevation: 8,
    }),
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6CD',
    padding: 16,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#45464D',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#191C1D',
  },
  summaryHint: {
    fontSize: 13,
    color: '#45464D',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  walletLabel: {
    fontSize: 13,
    color: '#45464D',
  },
  walletValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191C1D',
  },
});
