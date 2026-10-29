import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const topUpTokens = {
  PRIMARY: '#374BB1',
  ON_PRIMARY: '#FFFFFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  SURFACE: '#F8F9FA',
  SURFACE_LOWEST: '#FFFFFF',
  ERROR: '#BA1A1A',
  OUTLINE_VARIANT: '#C4C5D7',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: topUpTokens.SURFACE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 64,
    backgroundColor: topUpTokens.SURFACE,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: topUpTokens.PRIMARY,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  amountCard: {
    borderRadius: layout.radiusXl,
    backgroundColor: topUpTokens.SURFACE_LOWEST,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...createShadow({ color: colors.shadow, opacity: 0.06, radius: 12, offsetY: 4, elevation: 3 }),
  },
  amountLabel: {
    fontSize: 14,
    color: topUpTokens.ON_SURFACE_VARIANT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rupeeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: topUpTokens.ON_SURFACE,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coinsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: topUpTokens.PRIMARY,
  },
  devNote: {
    fontSize: 14,
    lineHeight: 20,
    color: topUpTokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
  processingBlock: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  processingText: {
    fontSize: 16,
    color: topUpTokens.ON_SURFACE_VARIANT,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: topUpTokens.PRIMARY,
    borderRadius: layout.radiusLg,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
  },
  primaryLabel: {
    color: topUpTokens.ON_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: topUpTokens.SURFACE_LOWEST,
    borderRadius: layout.radiusLg,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: topUpTokens.ERROR,
  },
  secondaryLabel: {
    color: topUpTokens.ERROR,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ghostLabel: {
    color: topUpTokens.ON_SURFACE_VARIANT,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
