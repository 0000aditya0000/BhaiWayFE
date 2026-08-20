import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6CD',
    overflow: 'hidden',
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 8, offsetY: 2, elevation: 2 }),
  },
  cardVerified: {
    borderLeftWidth: 4,
    borderLeftColor: '#374BB1',
  },
  body: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  driverRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5EEFF',
  },
  driverMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  driverName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: '#191C1D',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#374BB1',
  },
  vehicle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#45464D',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#191C1D',
  },
  priceCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#45464D',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  departureCol: {
    gap: 2,
  },
  departureTime: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#191C1D',
  },
  departureLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#45464D',
  },
  seatsCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  seatsLeft: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: '#7C839B',
  },
  seatsLeftUrgent: {
    color: '#BA1A1A',
  },
  seatsNote: {
    fontSize: 14,
    lineHeight: 20,
    color: '#45464D',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeUnverified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeVerifiedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: colors.primary,
  },
  badgeUnverifiedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  requestButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.shadow, opacity: 0.08, radius: 6, offsetY: 2, elevation: 2 }),
  },
  requestButtonBusy: {
    backgroundColor: colors.disabled,
  },
  requestButtonDone: {
    backgroundColor: '#5C5F61',
  },
  requestLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: colors.white,
  },
});
