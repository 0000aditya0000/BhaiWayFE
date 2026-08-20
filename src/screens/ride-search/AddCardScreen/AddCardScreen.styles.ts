import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.cardGap,
  },
  hero: {
    gap: 8,
    marginBottom: 8,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#191C1D',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#434655',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C6C6CD',
    padding: 20,
    gap: 16,
    ...createShadow({ color: colors.shadow, opacity: 0.04, radius: 12, offsetY: 2, elevation: 2 }),
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandChip: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#374BB1',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#434655',
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#C4C5D7',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#191C1D',
    backgroundColor: colors.white,
    ...androidTextInputFix,
  },
  inputFocused: {
    borderColor: '#374BB1',
    borderWidth: 2,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#747686',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  secureText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#5C5F61',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.04,
      radius: 20,
      offsetY: -4,
      elevation: 8,
    }),
  },
  saveButton: {
    width: '100%',
    height: layout.buttonHeight,
    borderRadius: 12,
    backgroundColor: '#374BB1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.white,
  },
});
