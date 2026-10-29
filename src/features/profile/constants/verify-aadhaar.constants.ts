export const VERIFY_AADHAAR_SCREEN = {
  headerTitle: 'Verify Aadhaar',
  heroTitle: 'Aadhar Verification',
  heroBody:
    'We use your Aadhar details to securely verify your identity. This helps keep our community safe and trusted.',
  aadhaarLabel: 'AADHAR NUMBER',
  aadhaarPlaceholder: '0000 0000 0000',
  otpNote:
    'A 6-digit OTP will be sent to the mobile number linked with your Aadhar for verification purposes.',
  getOtpLabel: 'Get OTP',
  submittingLabel: 'Sending OTP…',
  verifyingLabel: 'Verifying…',
  secureBadge: 'Secure & Encrypted',
  secureFooter:
    'Your data is encrypted using 256-bit AES protocols and is never shared without your consent.',
  otpTitle: 'Enter OTP',
  otpSubtitle: (maskedMobile: string) =>
    `Enter the 6-digit OTP sent to your Aadhar-linked mobile\n${maskedMobile}`,
  otpHint: 'Demo OTP',
  otpConfirmLabel: 'Verify Now',
  otpResendLabel: 'Resend the OTP',
  otpBackLabel: 'Change Aadhar number',
  otpInvalidMessage: 'Incorrect OTP. Please try again.',
  otpResentTitle: 'OTP Sent',
  otpResentMessage: (maskedMobile: string) =>
    `A new OTP has been sent to your Aadhar-linked mobile ${maskedMobile}.`,
  otpResentDoneLabel: 'Got it',
  otpLength: 6,
  demoOtp: '482916',
  validationTitle: 'Check your details',
  aadhaarRequired: 'Enter a valid 12-digit Aadhar number.',
  aadhaarInvalid: 'Aadhar number looks invalid. Please re-check the digits.',
} as const;
