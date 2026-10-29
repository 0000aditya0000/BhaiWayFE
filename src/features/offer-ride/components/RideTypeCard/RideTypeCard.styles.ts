import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(196, 197, 215, 0.7)',
    backgroundColor: colors.white,
    gap: spacing.md,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.07,
      radius: 14,
      offsetY: 6,
      elevation: 3,
    }),
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  cardFeatured: {
    borderColor: 'transparent',
    ...createShadow({
      color: colors.primaryDark,
      opacity: 0.24,
      radius: 18,
      offsetY: 8,
      elevation: 6,
    }),
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -40,
    right: -30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingLight: {
    backgroundColor: colors.surfaceMuted,
  },
  iconRingFeatured: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  titleLight: {
    color: colors.textPrimary,
  },
  titleFeatured: {
    color: colors.textInverse,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeLight: {
    backgroundColor: colors.accentLight,
  },
  badgeFeatured: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  description: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionLight: {
    color: colors.textSecondary,
  },
  descriptionFeatured: {
    color: 'rgba(255,255,255,0.88)',
  },
  perkList: {
    gap: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    ...typography.caption,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  note: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  noteLight: {
    color: colors.error,
  },
  noteFeatured: {
    color: 'rgba(255,220,220,0.92)',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBorderLight: {
    borderTopColor: 'rgba(196, 197, 215, 0.55)',
  },
  ctaBorderFeatured: {
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  ctaLabel: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '800',
  },
  ctaArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
