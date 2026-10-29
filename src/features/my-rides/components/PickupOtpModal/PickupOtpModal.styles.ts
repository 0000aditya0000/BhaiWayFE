import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE_VARIANT = '#C4C5D7';

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
    maxHeight: '88%',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(51, 94, 234, 0.1)',
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
  otpWrap: {
    marginBottom: spacing.lg,
  },
  hint: {
    alignSelf: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: '#F3F4F5',
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
  },
  actions: {
    gap: spacing.md,
  },
  verifyButton: {
    height: 52,
    borderRadius: layout.radiusXl,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyDisabled: {
    opacity: 0.5,
  },
  verifyLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.white,
  },
  cancelButton: {
    height: 52,
    borderRadius: layout.radiusXl,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  cancelLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
  },
  footerExtra: {
    marginTop: spacing.lg,
  },
});
