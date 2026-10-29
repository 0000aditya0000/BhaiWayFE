export type MorphingOtpStatus = 'idle' | 'verifying' | 'success' | 'error';

export interface MorphingOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fires once when the OTP reaches `cellCount` digits. */
  onComplete?: (code: string) => void;
  cellCount?: number;
  error?: string;
  /** Drives orbit → converge → green check / reset. */
  status?: MorphingOtpStatus;
  editable?: boolean;
  accessibilityLabel?: string;
}
