import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEEEF',
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    zIndex: 2,
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconStack: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  pulseOuter: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: '#FFDAD6',
    opacity: 0.2,
  },
  pulseInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFDAD6',
    opacity: 0.35,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.08,
      radius: 16,
      offsetY: 6,
      elevation: 4,
    }),
  },
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#191C1D',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#434655',
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    height: 56,
    borderRadius: layout.radiusXl,
    backgroundColor: '#4B61C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.white,
  },
});
