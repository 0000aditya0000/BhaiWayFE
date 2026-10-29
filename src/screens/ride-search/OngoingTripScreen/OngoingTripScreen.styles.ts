import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE_VARIANT = '#C4C5D7';
const SURFACE = '#F8F9FA';
const SURFACE_CONTAINER = '#EDEEEF';
const SURFACE_CONTAINER_HIGH = '#E7E8E9';
const ERROR = '#BA1A1A';
const RADIUS_XL = 20;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  mapLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.shadow, opacity: 0.14, radius: 12, offsetY: 4, elevation: 4 }),
  },
  etaPillWrap: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  etaPill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...createShadow({ color: colors.shadow, opacity: 0.14, radius: 12, offsetY: 4, elevation: 4 }),
  },
  etaTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  etaSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: ON_SURFACE_VARIANT,
  },
  sideControls: {
    position: 'absolute',
    right: 16,
    top: '42%',
    zIndex: 40,
    alignItems: 'center',
    gap: 16,
  },
  sosWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosPulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(186, 26, 26, 0.35)',
  },
  sosButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ERROR,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: ERROR, opacity: 0.35, radius: 16, offsetY: 6, elevation: 8 }),
  },
  zoomStack: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    padding: 8,
    gap: 8,
    ...createShadow({ color: colors.shadow, opacity: 0.12, radius: 10, offsetY: 3, elevation: 3 }),
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SURFACE_CONTAINER_HIGH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carMarkerWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(55, 75, 177, 0.2)',
  },
  carIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carLiveDot: {
    position: 'absolute',
    right: 8,
    bottom: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: colors.white,
  },
  destinationMarker: {
    alignItems: 'center',
  },
  destinationBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
    ...createShadow({ color: colors.shadow, opacity: 0.15, radius: 6, offsetY: 2, elevation: 3 }),
  },
  destinationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  sheetWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
    zIndex: 40,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    ...createShadow({ color: colors.shadow, opacity: 0.1, radius: 28, offsetY: -8, elevation: 10 }),
  },
  driverSection: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(196,197,215,0.3)',
  },
  driverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  driverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarRing: {
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(55, 75, 177, 0.1)',
    overflow: 'hidden',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: ON_SURFACE_VARIANT,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  vehicleCard: {
    backgroundColor: SURFACE_CONTAINER,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  plateLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: ON_SURFACE_VARIANT,
  },
  vehicleDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(196,197,215,0.5)',
    marginHorizontal: 12,
  },
  fareBlock: {
    alignItems: 'flex-end',
  },
  fareValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: PRIMARY,
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: ON_SURFACE_VARIANT,
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE_CONTAINER_HIGH,
    borderRadius: 16,
    padding: 16,
  },
  safetyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  safetyLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: ON_SURFACE,
  },
});

export const ongoingTripTokens = {
  PRIMARY,
  ON_SURFACE,
  ON_SURFACE_VARIANT,
  ERROR,
} as const;
