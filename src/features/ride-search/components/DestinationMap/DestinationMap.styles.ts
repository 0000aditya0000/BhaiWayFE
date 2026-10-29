import { StyleSheet } from 'react-native';
import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  centerPinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    ...createShadow({ color: colors.primary, opacity: 0.35, radius: 6, offsetY: 2, elevation: 4 }),
  },
  locateButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.primary, opacity: 0.15, radius: 10, offsetY: 3, elevation: 4 }),
  },
  mapControls: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.primary, opacity: 0.15, radius: 10, offsetY: 3, elevation: 4 }),
  },
  controlButtonActive: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  zoomControls: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg + 48 + spacing.sm + 48 + spacing.md,
    borderRadius: layout.radiusMd,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...createShadow({ color: colors.primary, opacity: 0.15, radius: 10, offsetY: 3, elevation: 4 }),
  },
  zoomButton: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
