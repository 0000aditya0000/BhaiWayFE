import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.md,
  },
  profileContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: {
    width: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
  },
  title: {
    position: 'absolute',
    left: layout.minTouchTarget + spacing.screenHorizontal,
    right: layout.minTouchTarget + spacing.screenHorizontal,
    textAlign: 'center',
    ...typography.title,
    color: colors.primary,
  },
  titlePlaceholder: {
    flex: 1,
  },
});
