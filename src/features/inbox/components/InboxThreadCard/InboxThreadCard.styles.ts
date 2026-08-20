import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE_VARIANT = '#C4C5D7';
const SURFACE = '#FFFFFF';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: SURFACE,
    borderRadius: layout.radiusXl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.35)',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.05,
      radius: 10,
      offsetY: 4,
      elevation: 2,
    }),
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: SURFACE,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    color: ON_SURFACE_VARIANT,
  },
  timeUnread: {
    color: PRIMARY,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    backgroundColor: 'rgba(51, 94, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: PRIMARY,
  },
  route: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: ON_SURFACE_VARIANT,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: ON_SURFACE_VARIANT,
  },
  previewUnread: {
    color: ON_SURFACE,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
