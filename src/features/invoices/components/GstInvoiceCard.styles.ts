import { StyleSheet } from 'react-native';

import { colors, layout, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(55, 75, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.label,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusTitle: {
    ...typography.label,
    fontSize: 15,
    color: colors.textPrimary,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 0,
    paddingTop: 2,
  },
  metaValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  amountValue: {
    ...typography.label,
    fontSize: 16,
    color: colors.primary,
    textAlign: 'right',
    flex: 1,
  },
  emailNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  primaryButton: {
    marginTop: spacing.md,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  primaryLabel: {
    ...typography.label,
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  secondaryLabel: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
