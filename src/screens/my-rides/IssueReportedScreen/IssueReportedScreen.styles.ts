import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const PRIMARY_CONTAINER = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const SECONDARY = '#585E72';
const OUTLINE_VARIANT = '#C4C5D7';
const SURFACE = '#F8F9FA';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: colors.white,
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 20, offsetY: 4, elevation: 3 }),
  },
  headerLeft: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 32,
  },
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(51, 94, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.shadow, opacity: 0.1, radius: 32, offsetY: 12, elevation: 6 }),
  },
  textBlock: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: ON_SURFACE,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    maxWidth: 360,
  },
  referenceCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 20, offsetY: 4, elevation: 3 }),
  },
  referenceMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  referenceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: SECONDARY,
  },
  referenceValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    paddingTop: 8,
  },
  primaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#EAEBFF',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SECONDARY,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: SECONDARY,
  },
  footerSpacer: {
    height: spacing.sm,
  },
});
