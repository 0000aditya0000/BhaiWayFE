import { StyleSheet } from 'react-native';

import { layout, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#FFF8E8',
    borderRadius: layout.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.2)',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  message: {
    ...typography.caption,
    color: '#7A4A00',
    lineHeight: 20,
    fontWeight: '600',
  },
  scope: {
    ...typography.caption,
    color: '#7A4A00',
    lineHeight: 18,
  },
});
