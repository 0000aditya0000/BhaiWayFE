export const CORPORATE_IDENTITY_SCREEN = {
  title: 'Corporate Identity',
  subtitle:
    'Verify your official company email to unlock office commute benefits on BhaiWay.',
  notVerifiedLabel: 'Not Verified',
  otpPendingLabel: 'OTP Pending',
  verifiedLabel: 'Verified',
  verifyCta: 'Verify Corporate Email',
  continuePendingCta: 'Continue verification',
  changeEmailCta: 'Verify another email',
  loadingLabel: 'Checking corporate identity…',
  verifiedAtLabel: 'Verified on',
} as const;

export const CORPORATE_IDENTITY_VERIFY_SCREEN = {
  emailTitle: 'Corporate Email',
  emailSubtitle: 'Enter your official company email address.',
  emailLabel: 'Corporate Email',
  emailPlaceholder: 'employee@company.com',
  continueLabel: 'Continue',
  sendingLabel: 'Sending…',
  otpTitle: 'Verify corporate email',
  otpDescription: (email: string) =>
    `Enter the verification code sent to ${email}`,
  otpLabel: '4 digit corporate verification code',
  verifyLabel: 'Verify',
  verifyingLabel: 'Verifying…',
  resendLabel: 'Resend code',
  resendCountdown: (seconds: number) => `Resend code in ${seconds}s`,
  changeEmailLabel: 'Change email',
  successTitle: 'Corporate identity verified',
  successMessage: 'Your corporate email has been verified successfully.',
} as const;
