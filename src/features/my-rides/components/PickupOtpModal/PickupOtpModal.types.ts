import type { ReactNode } from 'react';

export interface PickupOtpModalProps {
  visible: boolean;
  passengerName: string;
  otpLength: number;
  value: string;
  error: string | null;
  verifying: boolean;
  hintOtp?: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  onClose: () => void;
  /**
   * Optional extra action rendered below OTP cancel.
   * Must not share the OTP verify handler — used for passenger No-Show.
   */
  footerExtra?: ReactNode;
}
