import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  intro: {
    marginBottom: spacing.lg,
    gap: 6,
  },
  introTitle: {
    ...typography.title,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  introSubtitle: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  cards: {
    gap: 0,
  },
});
