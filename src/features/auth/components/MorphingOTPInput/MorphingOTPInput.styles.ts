import { StyleSheet } from 'react-native';

import { colors, fonts, spacing, typography } from '@/theme';

export const CELL_SIZE = 56;
export const CELL_GAP = 12;
export const STAGE_HEIGHT = 220;
export const ORBIT_DIGIT_SIZE = 44;
export const SUCCESS_SIZE = 72;
export const SUCCESS_GREEN = '#22C55E';

/** Premium OTP orbit timeline (ms). */
export const OTP_ANIM = {
  setupMs: 400,
  minOrbitMs: 1000,
  convergeMs: 500,
  vanishMs: 250,
  checkMs: 350,
  pulseMs: 300,
} as const;

export const MORPHING_OTP_TIMING = {
  ...OTP_ANIM,
  /** Min time in verifying before success UI may progress (setup + orbit). */
  spinnerMinMs: OTP_ANIM.setupMs + OTP_ANIM.minOrbitMs,
  /** Total hold from verifying start → navigation when API is instant. */
  successHoldMs:
    OTP_ANIM.setupMs +
    OTP_ANIM.minOrbitMs +
    OTP_ANIM.convergeMs +
    OTP_ANIM.vanishMs +
    OTP_ANIM.checkMs +
    OTP_ANIM.pulseMs,
} as const;

export const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
  },
  stage: {
    width: '100%',
    height: STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cellText: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  orbitLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDigit: {
    position: 'absolute',
    width: ORBIT_DIGIT_SIZE,
    height: ORBIT_DIGIT_SIZE,
    marginLeft: -ORBIT_DIGIT_SIZE / 2,
    marginTop: -ORBIT_DIGIT_SIZE / 2,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDigitText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  successWrap: {
    position: 'absolute',
    width: SUCCESS_SIZE,
    height: SUCCESS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: SUCCESS_SIZE,
    height: SUCCESS_SIZE,
    borderRadius: SUCCESS_SIZE / 2,
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successPulse: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: SUCCESS_SIZE / 2,
    borderWidth: 2,
    borderColor: SUCCESS_GREEN,
  },
  statusLabel: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    minHeight: 18,
  },
  error: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
});
