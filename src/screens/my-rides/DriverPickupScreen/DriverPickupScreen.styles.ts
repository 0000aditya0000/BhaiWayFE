import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const SECONDARY = '#585E72';
const SURFACE = '#F8F9FA';
const SURFACE_LOW = '#F3F4F5';
const PRIMARY_CONTAINER = '#EAEBFF';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 64,
    bottom: 80,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  pickupMarker: {
    alignItems: 'center',
  },
  pickupBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
    ...createShadow({ color: colors.shadow, opacity: 0.18, radius: 6, offsetY: 2, elevation: 3 }),
  },
  pickupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.5)',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.12,
      radius: 20,
      offsetY: 8,
      elevation: 6,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  nextStopLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: SECONDARY,
  },
  pickupTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: ON_SURFACE,
  },
  passengerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.15,
      radius: 8,
      offsetY: 3,
      elevation: 3,
    }),
  },
  passengerName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: SURFACE_LOW,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.2)',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    gap: 2,
  },
  locationLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  etaLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: ON_SURFACE_VARIANT,
  },
  spacer: {
    flex: 1,
  },
  swipeWrap: {
    ...createShadow({
      color: colors.shadow,
      opacity: 0.1,
      radius: 12,
      offsetY: 4,
      elevation: 4,
    }),
  },
});
