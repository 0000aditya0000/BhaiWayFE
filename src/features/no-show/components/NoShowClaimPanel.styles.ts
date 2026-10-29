import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';

export const styles = StyleSheet.create({
  reportButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  reportButtonMuted: {
    opacity: 0.55,
  },
  reportLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.error,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardPending: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  cardApproved: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  cardRejected: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillApproved: {
    backgroundColor: colors.successSoft,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  actionButtonDanger: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.white,
  },
  actionLabelDanger: {
    color: colors.error,
  },
  supportButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  compactReport: {
    minHeight: 44,
    borderRadius: layout.radiusXl,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
