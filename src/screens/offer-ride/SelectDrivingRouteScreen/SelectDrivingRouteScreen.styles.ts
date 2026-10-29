import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapWrap: {
    flex: 1.15,
    minHeight: 220,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  status: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  statusText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
});
