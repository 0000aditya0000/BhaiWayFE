import { StyleSheet } from 'react-native';
import { colors, layout, spacing } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    minHeight: layout.minTouchTarget + spacing.md * 2,
  },
  slot: {
    width: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  slotWide: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  /** Absolutely centered so title stays in the middle of the screen. */
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.minTouchTarget + spacing.md,
    zIndex: 1,
  },
});
