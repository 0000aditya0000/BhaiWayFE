import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: layout.radiusXl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(198, 198, 205, 0.3)',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.04,
      radius: 20,
      offsetY: 4,
      elevation: 3,
    }),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.label,
    fontSize: 15,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    ...typography.label,
    color: colors.textPrimary,
  },
  percentage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  selected: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.primary,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#EFF4FF',
    borderRadius: layout.radiusMd,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
