import { StyleSheet } from 'react-native';

import { colors, layout } from '@/shared/theme';

export const styles = StyleSheet.create({
  button: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeWide: {
    minWidth: 26,
    paddingHorizontal: 5,
  },
  countBadgeLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
