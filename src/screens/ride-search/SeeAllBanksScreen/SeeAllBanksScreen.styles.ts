import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { androidTextInputFix, createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6CD',
    backgroundColor: '#F8F9FF',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C4C5D7',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#191C1D',
    ...androidTextInputFix,
  },
  searchInputFocused: {
    borderColor: '#374BB1',
    borderWidth: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#434655',
    marginTop: 8,
    marginBottom: 4,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(198, 198, 205, 0.35)',
    ...createShadow({ color: colors.shadow, opacity: 0.03, radius: 8, offsetY: 2, elevation: 1 }),
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: '#191C1D',
  },
  emptyWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyLabel: {
    fontSize: 15,
    lineHeight: 22,
    color: '#747686',
    textAlign: 'center',
  },
});
