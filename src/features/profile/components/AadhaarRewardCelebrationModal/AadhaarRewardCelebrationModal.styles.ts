import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const tokens = {
  PRIMARY: '#374BB1',
  PRIMARY_CONTAINER: '#4B61C4',
  ON_PRIMARY_CONTAINER: '#EAEBFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: 'rgba(196, 197, 215, 0.2)',
  GLASS: 'rgba(255, 255, 255, 0.72)',
  ACCENT_SOFT: '#EEF1FF',
  SUCCESS: '#1B8F4E',
} as const;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: tokens.GLASS,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    padding: spacing.xxxl,
    borderWidth: 1,
    borderColor: tokens.OUTLINE_VARIANT,
    overflow: 'hidden',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.1,
      radius: 32,
      offsetY: 12,
      elevation: 8,
    }),
  },
  confettiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  confetti: {
    fontSize: 28,
    lineHeight: 34,
  },
  emojiWrap: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: spacing.huge,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.28,
    color: tokens.ON_SURFACE,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
    maxWidth: 300,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: tokens.SUCCESS,
    textAlign: 'center',
  },
  primaryButton: {
    height: 56,
    borderRadius: layout.radiusXl,
    backgroundColor: tokens.PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: tokens.ON_PRIMARY_CONTAINER,
  },
});
