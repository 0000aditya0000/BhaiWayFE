import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import { createShadow } from '@/shared/utils/platform';

const PRIMARY = '#374BB1';
const PRIMARY_CONTAINER = '#4B61C4';
const ON_SURFACE = '#191C1D';
const ON_SURFACE_VARIANT = '#434655';
const OUTLINE_VARIANT = '#C4C5D7';
const SURFACE = '#F8F9FA';
const SURFACE_LOW = '#F3F4F5';
const ERROR = '#BA1A1A';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  header: {
    position: 'relative',
    height: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248,249,250,0.95)',
    ...createShadow({
      color: colors.shadow,
      opacity: 0.06,
      radius: 6,
      offsetY: 2,
      elevation: 2,
    }),
  },
  headerLeft: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: PRIMARY,
    flexShrink: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: spacing.huge,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  optionalLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ON_SURFACE_VARIANT,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  issueCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: '42%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  issueCardActive: {
    borderWidth: 2,
    borderColor: PRIMARY_CONTAINER,
    backgroundColor: '#F0F4FF',
  },
  issueLabel: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: ON_SURFACE_VARIANT,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  captureSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#747686',
    backgroundColor: SURFACE_LOW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  captureLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: PRIMARY,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: SURFACE_LOW,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ERROR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: ON_SURFACE_VARIANT,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  commentsInput: {
    minHeight: 128,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    backgroundColor: colors.white,
    padding: spacing.lg,
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE,
  },
  submitWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: SURFACE,
    gap: spacing.md,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: PRIMARY_CONTAINER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...createShadow({
      color: colors.shadow,
      opacity: 0.15,
      radius: 12,
      offsetY: 6,
      elevation: 5,
    }),
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.white,
  },
  submitHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: ON_SURFACE_VARIANT,
    paddingHorizontal: spacing.lg,
  },
});
