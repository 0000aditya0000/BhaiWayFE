import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const logoutTokens = {
  PRIMARY: '#374BB1',
  PRIMARY_CONTAINER: '#4B61C4',
  ON_PRIMARY_CONTAINER: '#EAEBFF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: 'rgba(196, 197, 215, 0.2)',
  GLASS: 'rgba(255, 255, 255, 0.72)',
} as const;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: logoutTokens.GLASS,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    padding: spacing.xxxl,
    borderWidth: 1,
    borderColor: logoutTokens.OUTLINE_VARIANT,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.1,
      radius: 32,
      offsetY: 12,
      elevation: 8,
    }),
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoCircle: {
    width: layout.logoCardSize,
    height: layout.logoCardSize,
    borderRadius: layout.logoCardRadius,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: logoutTokens.OUTLINE_VARIANT,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.08,
      radius: 12,
      offsetY: 6,
      elevation: 4,
    }),
  },
  logo: {
    width: layout.logoSize,
    height: layout.logoSize,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: spacing.huge,
    gap: spacing.md,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.32,
    color: logoutTokens.ON_SURFACE,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: logoutTokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    gap: spacing.lg,
  },
  confirmButton: {
    height: 56,
    borderRadius: layout.radiusXl,
    backgroundColor: logoutTokens.PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: logoutTokens.ON_PRIMARY_CONTAINER,
  },
  cancelButton: {
    height: 56,
    borderRadius: layout.radiusXl,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C4C5D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: logoutTokens.ON_SURFACE_VARIANT,
  },
});
