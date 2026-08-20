import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE_VARIANT = '#C4C5D7';
const SURFACE = '#F8F9FA';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.06,
      radius: 6,
      offsetY: 2,
      elevation: 2,
    }),
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: ON_SURFACE_VARIANT,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: OUTLINE_VARIANT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: spacing.cardGap,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(51, 94, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: ON_SURFACE,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
});
