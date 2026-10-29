import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xs,
    minHeight: 44,
  },
  topBarSpacer: {
    flex: 1,
  },
  heading: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },
  inputWrapper: {
    marginBottom: spacing.xxxl,
  },
  referralWrapper: {
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  referralHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  buttonWrapper: {
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
});
