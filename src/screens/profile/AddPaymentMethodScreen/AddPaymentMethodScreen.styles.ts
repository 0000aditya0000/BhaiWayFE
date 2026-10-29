import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const tokens = {
  PRIMARY: '#374BB1',
  PRIMARY_FIXED: '#DDE1FF',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE_VARIANT: '#C4C5D7',
  SURFACE: '#F8F9FA',
  SURFACE_LOWEST: '#FFFFFF',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.OUTLINE_VARIANT,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: tokens.PRIMARY,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.cardGap,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: tokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: tokens.ON_SURFACE,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: tokens.ON_SURFACE_VARIANT,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.radiusLg,
    borderWidth: 1,
    borderColor: tokens.OUTLINE_VARIANT,
    backgroundColor: tokens.SURFACE,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.PRIMARY_FIXED,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: tokens.ON_SURFACE,
  },
});
