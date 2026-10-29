import { StyleSheet } from 'react-native';

import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 64,
    backgroundColor: colors.surface,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.05,
      radius: 12,
      offsetY: 4,
      elevation: 2,
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandName: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  intro: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    padding: spacing.xl,
    gap: spacing.md,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.05,
      radius: 20,
      offsetY: 4,
      elevation: 2,
    }),
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'rgba(51, 94, 234, 0.2)',
  },
  passengerMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: 'center',
  },
  passengerName: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  passengerRole: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingLeft: 80,
  },
  starButton: {
    padding: 2,
  },
  footerBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  submitBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: layout.radiusXl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...createShadow({
      color: colors.primary,
      opacity: 0.28,
      radius: 12,
      offsetY: 4,
      elevation: 4,
    }),
  },
  skipBtn: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  progress: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: layout.radiusLg,
    backgroundColor: colors.primary,
  },
  retryLabel: {
    ...typography.button,
    color: colors.white,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitLabel: {
    ...typography.button,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.textInverse,
  },
  hint: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
