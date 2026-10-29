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
  SUCCESS: '#1B8F4E',
  SUCCESS_SOFT: '#E8F7EE',
  ERROR: '#B3261E',
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
  content: {
    padding: spacing.lg,
    gap: spacing.cardGap,
    paddingBottom: spacing.huge,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.ON_SURFACE,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: tokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    ...createShadow({ color: '#000000', opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.ON_SURFACE_VARIANT,
  },
  heroAmount: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: tokens.ON_SURFACE,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.SUCCESS_SOFT,
    borderRadius: layout.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.SUCCESS,
  },
  statusDesc: {
    fontSize: 13,
    color: tokens.ON_SURFACE_VARIANT,
  },
  card: {
    backgroundColor: tokens.SURFACE_LOWEST,
    borderRadius: layout.radiusXl,
    padding: spacing.xxl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: tokens.ON_SURFACE_VARIANT,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.ON_SURFACE,
  },
  rowMeta: {
    fontSize: 14,
    color: tokens.ON_SURFACE_VARIANT,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.OUTLINE_VARIANT,
  },
  timelineText: { flex: 1, gap: 2 },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.ON_SURFACE,
  },
  timelineValue: {
    fontSize: 13,
    color: tokens.ON_SURFACE_VARIANT,
  },
});
