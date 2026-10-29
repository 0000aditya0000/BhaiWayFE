import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    padding: 20,
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191C1D',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rating: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#191C1D',
  },
  dot: {
    fontSize: 14,
    color: '#747686',
    marginHorizontal: 2,
  },
  company: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.primary,
  },
  ratingsCount: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: '#747686',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  vehicleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#191C1D',
  },
  vehicleDivider: {
    color: '#747686',
  },
});
