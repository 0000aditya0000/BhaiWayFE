import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { androidTextInputFix, createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const PRIMARY_CONTAINER = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE = '#747686';
const OUTLINE_VARIANT = '#C4C5D7';
const ERROR = '#BA1A1A';
const ERROR_CONTAINER = '#FFDAD6';
const SURFACE = '#F8F9FA';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: SURFACE,
  },
  headerSide: {
    zIndex: 2,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    flex: 1,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cancelIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ERROR_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: ON_SURFACE,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    maxWidth: 340,
  },
  assuredConfirmPrompt: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: ON_SURFACE,
    textAlign: 'center',
    maxWidth: 340,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 20, offsetY: 4, elevation: 3 }),
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  detailsLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: OUTLINE,
  },
  assuredBadge: {
    backgroundColor: 'rgba(51, 94, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  assuredBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: PRIMARY_CONTAINER,
  },
  regularBadge: {
    backgroundColor: 'rgba(116, 118, 134, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  regularBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: OUTLINE,
  },
  policyCardAssured: {
    backgroundColor: 'rgba(255, 218, 214, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  policyCardRegular: {
    backgroundColor: 'rgba(51, 94, 234, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(51, 94, 234, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  policyTitleAssured: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ERROR,
  },
  policyTitleRegular: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PRIMARY,
  },
  policyTextAssured: {
    fontSize: 14,
    lineHeight: 20,
    color: '#93000A',
  },
  policyTextRegular: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A237E',
  },
  routeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  routeTrack: {
    alignItems: 'center',
    paddingTop: 4,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: colors.white,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: OUTLINE_VARIANT,
    marginVertical: 4,
  },
  dropDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ERROR,
  },
  stopMeta: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
    minHeight: 72,
  },
  stopValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E4',
  },
  scheduleText: {
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE_VARIANT,
  },
  scheduleStrong: {
    fontWeight: '600',
    color: ON_SURFACE,
  },
  policyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  policyCopy: {
    flex: 1,
    gap: 4,
  },
  policyStrong: {
    fontWeight: '700',
  },
  reasonSection: {
    marginBottom: 32,
  },
  reasonTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ON_SURFACE_VARIANT,
    marginBottom: 16,
  },
  reasonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    backgroundColor: colors.white,
  },
  reasonChipSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  reasonChipLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: ON_SURFACE_VARIANT,
  },
  reasonChipLabelSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  otherInput: {
    width: '100%',
    marginTop: 16,
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    backgroundColor: colors.white,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE,
    textAlignVertical: 'top',
    ...androidTextInputFix,
  },
  otherInputFocused: {
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  keepButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  confirmButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ERROR,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: ERROR,
  },
});

export const cancelRideTokens = {
  PRIMARY,
  spacing,
} as const;
