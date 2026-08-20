import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';
import { androidTextInputFix } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  section: {
    gap: spacing.listGap,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#191C1D',
  },
  promoWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  promoInput: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#C6C6CD',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingRight: 108,
    fontSize: 16,
    lineHeight: 24,
    color: '#191C1D',
    ...androidTextInputFix,
  },
  applyButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    backgroundColor: '#374BB1',
    borderRadius: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: colors.white,
  },
  fareCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6CD',
    padding: 16,
    gap: spacing.listGap,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#45464D',
  },
  fareValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#45464D',
  },
  discount: {
    color: '#2E7D32',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6CD',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#191C1D',
  },
  totalValue: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#191C1D',
  },
  promoSuccess: {
    fontSize: 12,
    lineHeight: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
});
