import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  mapWrap: {
    height: 192,
    backgroundColor: '#EDEEEF',
    position: 'relative',
  },
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mapFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  routeBody: {
    padding: 20,
  },
  routeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  indicator: {
    alignItems: 'center',
    paddingTop: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    ...createShadow({ color: colors.primary, opacity: 0.25, radius: 6, offsetY: 0, elevation: 2 }),
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 48,
    marginVertical: 4,
    backgroundColor: 'rgba(196, 197, 215, 0.7)',
  },
  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#747686',
    backgroundColor: colors.white,
  },
  locations: {
    flex: 1,
    gap: 24,
  },
  locationBlock: {
    gap: 2,
  },
  locationLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#434655',
    marginBottom: 2,
  },
  locationTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#191C1D',
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 20,
    color: '#747686',
  },
});
