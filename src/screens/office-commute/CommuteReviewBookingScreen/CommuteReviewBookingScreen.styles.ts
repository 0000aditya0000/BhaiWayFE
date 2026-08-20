import { StyleSheet } from 'react-native';
import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    ...createShadow({ color: colors.shadow, opacity: 0.06, radius: 8, offsetY: 2, elevation: 3 }),
  },
  headerLeft: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.primary,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: spacing.cardGap,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(198, 198, 205, 0.3)',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.04,
      radius: 20,
      offsetY: -4,
      elevation: 8,
    }),
  },
  confirmButton: {
    width: '100%',
    height: layout.buttonHeight,
    backgroundColor: '#374BB1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...createShadow({ color: colors.shadow, opacity: 0.16, radius: 12, offsetY: 4, elevation: 4 }),
  },
  confirmButtonBusy: {
    opacity: 0.85,
  },
  confirmLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.white,
  },
});
