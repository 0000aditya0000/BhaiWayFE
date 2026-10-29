import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  container: {
    height: 256,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#DCE9FF',
  },
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  distanceBadge: {
    position: 'absolute',
    left: 20,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    ...createShadow({ color: colors.shadow, opacity: 0.1, radius: 10, offsetY: 3, elevation: 4 }),
  },
  distanceCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#45464D',
  },
  distanceValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#191C1D',
  },
});
