import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: colors.background,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 8, offsetY: 2, elevation: 2 }),
  },
  cardExpanded: {
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceMuted,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  question: {
    ...typography.label,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    flex: 1,
  },
  answerWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  answer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingTop: spacing.md,
  },
});
