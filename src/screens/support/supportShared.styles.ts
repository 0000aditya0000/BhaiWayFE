import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

export const supportTokens = {
  PRIMARY: '#374BB1',
  ON_SURFACE: '#191C1D',
  ON_SURFACE_VARIANT: '#434655',
  OUTLINE: '#747686',
  OUTLINE_VARIANT: 'rgba(196, 197, 215, 0.3)',
  SURFACE: '#F8F9FA',
  SURFACE_CONTAINER: '#EDEEEF',
  SECONDARY: '#585E72',
  RESOLVED_BG: '#D1FAE5',
  RESOLVED_TEXT: '#065F46',
  PROGRESS_BG: '#FEF3C7',
  PROGRESS_TEXT: '#92400E',
  CREATED_BG: '#E0E7FF',
  CREATED_TEXT: '#3730A3',
  ERROR: '#B42318',
} as const;

export const supportSharedStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: supportTokens.SURFACE,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
    backgroundColor: supportTokens.SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C4C5D7',
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: supportTokens.PRIMARY,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.xl,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    padding: spacing.xl,
    borderRadius: layout.radiusLg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: supportTokens.OUTLINE_VARIANT,
    ...createShadow({ color: colors.shadow, opacity: 0.05, radius: 16, offsetY: 4, elevation: 2 }),
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: supportTokens.ON_SURFACE,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: supportTokens.ON_SURFACE_VARIANT,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    color: supportTokens.OUTLINE,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: supportTokens.ERROR,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: supportTokens.OUTLINE_VARIANT,
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: supportTokens.PRIMARY,
    backgroundColor: 'rgba(55, 75, 177, 0.1)',
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: supportTokens.ON_SURFACE_VARIANT,
  },
  chipLabelSelected: {
    color: supportTokens.PRIMARY,
  },
  primaryButton: {
    height: 56,
    borderRadius: layout.radiusXl,
    backgroundColor: supportTokens.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.white,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusResolved: {
    backgroundColor: supportTokens.RESOLVED_BG,
  },
  statusProgress: {
    backgroundColor: supportTokens.PROGRESS_BG,
  },
  statusCreated: {
    backgroundColor: supportTokens.CREATED_BG,
  },
  statusLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statusLabelResolved: {
    color: supportTokens.RESOLVED_TEXT,
  },
  statusLabelProgress: {
    color: supportTokens.PROGRESS_TEXT,
  },
  statusLabelCreated: {
    color: supportTokens.CREATED_TEXT,
  },
  emptyWrap: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
