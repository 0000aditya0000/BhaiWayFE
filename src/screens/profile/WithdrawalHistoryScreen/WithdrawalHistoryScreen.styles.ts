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
  SUCCESS_SOFT: '#E8F7EE',
  SUCCESS: '#1B8F4E',
} as const;

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.SURFACE },
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.huge,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
    borderRadius: layout.radiusXl,
    backgroundColor: tokens.SURFACE_LOWEST,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.ON_SURFACE,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: tokens.ON_SURFACE_VARIANT,
    textAlign: 'center',
  },
  rowCard: {
    backgroundColor: tokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 10, offsetY: 2, elevation: 2 }),
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.ON_SURFACE,
  },
  rowAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: tokens.ON_SURFACE,
  },
  rowMeta: {
    fontSize: 13,
    color: tokens.ON_SURFACE_VARIANT,
  },
  statusPill: {
    backgroundColor: tokens.SUCCESS_SOFT,
    borderRadius: layout.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.SUCCESS,
  },
});
