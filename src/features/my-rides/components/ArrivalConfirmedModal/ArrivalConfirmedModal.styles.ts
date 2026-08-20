import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(25, 28, 29, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.12,
      radius: 24,
      offsetY: 10,
      elevation: 8,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(27, 122, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
  riderName: {
    fontWeight: '700',
    color: ON_SURFACE,
  },
  continueButton: {
    height: 52,
    borderRadius: layout.radiusXl,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.white,
  },
});
