import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { androidTextInputFix, createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const PRIMARY_CONTAINER = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE = '#747686';
const OUTLINE_VARIANT = '#C4C5D7';
const SURFACE = '#F8F9FA';
const SECONDARY_CONTAINER = '#DADFF7';
const RADIUS_LG = 16;
const RADIUS_XL = 12;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  headerWrap: {
    backgroundColor: colors.white,
    ...createShadow({ color: colors.shadow, opacity: 0.06, radius: 6, offsetY: 2, elevation: 2 }),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: OUTLINE,
    paddingHorizontal: 4,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS_LG,
    borderWidth: 1,
    borderColor: 'rgba(196, 197, 215, 0.3)',
    padding: 24,
    gap: 20,
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 20, offsetY: 4, elevation: 3 }),
  },
  summaryBody: {
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
  stopMeta: {
    flex: 1,
    gap: 16,
  },
  stopBlock: {
    gap: 2,
  },
  stopLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: OUTLINE,
  },
  stopValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  dateBlock: {
    gap: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDEEEF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47.5%',
    minHeight: 120,
    backgroundColor: colors.white,
    borderRadius: RADIUS_LG,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 20, offsetY: 4, elevation: 2 }),
  },
  categoryCardSelected: {
    borderColor: PRIMARY_CONTAINER,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SECONDARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryIconWrapSelected: {
    backgroundColor: PRIMARY,
  },
  categoryLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: ON_SURFACE,
  },
  field: {
    gap: 8,
  },
  textArea: {
    minHeight: 140,
    borderRadius: RADIUS_LG,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    backgroundColor: colors.white,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE,
    textAlignVertical: 'top',
    ...androidTextInputFix,
  },
  textAreaFocused: {
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  uploadPreview: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS_LG,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: '#E1E3E4',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  submitButton: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    ...createShadow({ color: PRIMARY, opacity: 0.28, radius: 12, offsetY: 6, elevation: 6 }),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.white,
  },
});

export const reportIssueTokens = {
  PRIMARY,
  OUTLINE,
  spacing,
} as const;
