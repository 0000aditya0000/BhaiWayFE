import { StyleSheet } from 'react-native';

import { colors } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE_VARIANT = '#C4C5D7';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    padding: 16,
    gap: 12,
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 12, offsetY: 3, elevation: 3 }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: PRIMARY,
    textTransform: 'uppercase',
  },
  routeLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8EAF6',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: PRIMARY,
    textTransform: 'uppercase',
  },
  statusTextCancelled: {
    color: '#B91C1C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  assuredBadge: {
    backgroundColor: '#E8EAF6',
  },
  regularBadge: {
    backgroundColor: '#F3F4F5',
  },
  typeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  assuredText: {
    color: PRIMARY,
  },
  regularText: {
    color: ON_SURFACE_VARIANT,
  },
  cancelledAt: {
    fontSize: 12,
    lineHeight: 16,
    color: '#B91C1C',
  },
  metaLine: {
    fontSize: 13,
    lineHeight: 18,
    color: ON_SURFACE_VARIANT,
  },
  routeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 197, 215, 0.35)',
  },
  routeStop: {
    flex: 1,
    gap: 2,
  },
  stopCaption: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: ON_SURFACE_VARIANT,
    textTransform: 'uppercase',
  },
  stopValue: {
    fontSize: 13,
    lineHeight: 18,
    color: ON_SURFACE,
  },
  detailsButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: '#EAEBFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  detailsLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: PRIMARY,
  },
});
