export const IDENTITY_VERIFICATION_SCREEN = {
  title: 'Identity Verification',
  subtitle:
    'Choose how you want to verify. Aadhaar builds trust for all rides; corporate email unlocks office commute benefits.',
  aadhaar: {
    id: 'aadhaar' as const,
    title: 'Aadhaar Verification',
    subtitle: 'Verify with DigiLocker using your Aadhaar-linked mobile number.',
    cta: 'Verify Aadhaar',
    verifiedLabel: 'Verified',
    icon: 'id-card-outline' as const,
  },
  corporateEmail: {
    id: 'corporateEmail' as const,
    title: 'Corporate Identity',
    subtitle: 'Verify your official company email with a one-time code.',
    cta: 'Verify Corporate Email',
    verifiedLabel: 'Verified',
    pendingLabel: 'OTP Pending',
    notVerifiedLabel: 'Not Verified',
    icon: 'briefcase-outline' as const,
  },
} as const;

export type IdentityVerificationMethodId = 'aadhaar' | 'corporateEmail';
