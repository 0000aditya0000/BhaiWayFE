import { StyleSheet } from 'react-native';

import { colors, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  name: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  seatsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seatsText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
