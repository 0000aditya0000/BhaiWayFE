import { StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: layout.avatarSize,
    height: layout.avatarSize,
    borderRadius: layout.avatarSize / 2,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(55, 75, 177, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    marginTop: spacing.sm,
    color: colors.error,
    ...typography.caption,
  },
});
