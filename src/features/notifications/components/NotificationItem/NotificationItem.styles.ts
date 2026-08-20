import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
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
  cardUnread: {
    borderColor: 'rgba(55, 75, 177, 0.22)',
    backgroundColor: colors.surfaceMuted,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  titleUnread: {
    fontWeight: '700',
    color: colors.primary,
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  bodyUnread: {
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
