import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  headingContainer: {
    alignItems: 'center',
  },
  headingLine: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headingBrand: {
    ...typography.displayLarge,
    color: colors.textBrand,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
});
