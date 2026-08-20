import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const missingLocationTokens = {
  PRIMARY: '#374BB1',
  PRIMARY_CONTAINER: '#4B61C4',
  PRIMARY_FIXED: '#DDE1FF',
  ON_PRIMARY: '#FFFFFF',
  ON_PRIMARY_CONTAINER: '#EAEBFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: 'rgba(196, 197, 215, 0.25)',
  OVERLAY: 'rgba(25, 28, 29, 0.45)',
} as const;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: missingLocationTokens.OVERLAY,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    padding: spacing.xxxl,
    borderWidth: 1,
    borderColor: missingLocationTokens.OUTLINE_VARIANT,
    alignItems: 'center',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.12,
      radius: 28,
      offsetY: 10,
      elevation: 8,
    }),
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: missingLocationTokens.PRIMARY_FIXED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: missingLocationTokens.ON_SURFACE,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: missingLocationTokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    maxWidth: 300,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: layout.radiusLg,
    backgroundColor: missingLocationTokens.PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: missingLocationTokens.ON_PRIMARY_CONTAINER,
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: layout.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: missingLocationTokens.ON_SURFACE_VARIANT,
  },
});
