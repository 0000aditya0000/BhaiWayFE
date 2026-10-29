export type AuthFaqTopic = 'auth' | 'profile';

export const AUTH_FAQ_SCREEN = {
  title: 'FAQ',
  emptyLabel: 'No matching questions.',
  auth: {
    subtitle: 'Common questions about signing in with your mobile number.',
  },
  profile: {
    subtitle: 'Help with completing your Setup Profile details.',
  },
} as const;

export interface AuthFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const AUTH_FAQ_ITEMS: readonly AuthFaqItem[] = [
  {
    id: 'why-phone',
    question: 'Why do you need my mobile number?',
    answer:
      'We use your mobile number to verify your identity and keep your BhaiWay account secure. You will receive a one-time verification code (OTP) on this number.',
  },
  {
    id: 'otp-time',
    question: 'How long does the OTP take to arrive?',
    answer:
      'Most codes arrive within a few seconds. If you do not receive it within 1–2 minutes, tap Resend on the verification screen. Check that your number is correct and that you have network coverage.',
  },
  {
    id: 'wrong-number',
    question: 'I entered the wrong number. What should I do?',
    answer:
      'Go back to the previous screen, correct your 10-digit mobile number, and continue again. A new OTP will be sent to the updated number.',
  },
  {
    id: 'otp-not-working',
    question: 'The OTP is not working. What can I try?',
    answer:
      'Confirm you entered the latest code, that it has not expired, and that there are no extra spaces. Request a new code with Resend, then try again. If the issue continues, contact BhaiWay support.',
  },
  {
    id: 'data-safe',
    question: 'Is my phone number safe with BhaiWay?',
    answer:
      'Yes. Your number is used only for account verification, trip updates, and important security alerts. We do not share it for unrelated marketing.',
  },
  {
    id: 'change-later',
    question: 'Can I change my number later?',
    answer:
      'Yes. After you sign in, you can update account details from Profile. Some changes may require OTP verification again for security.',
  },
] as const;

export const PROFILE_FAQ_ITEMS: readonly AuthFaqItem[] = [
  {
    id: 'why-profile',
    question: 'Why do I need to complete Setup Profile?',
    answer:
      'Your name and email help us personalize rides and keep your account ready for bookings. Gender comes from identity verification and cannot be edited manually. You cannot continue to Home until required details are saved.',
  },
  {
    id: 'required-fields',
    question: 'Which fields are required?',
    answer:
      'Full Name, Email Address, and Gender are required. Tap Save and Continue once all three are filled correctly. Your profile photo is optional and can be added later.',
  },
  {
    id: 'verify-now-optional',
    question: 'Do I have to tap Verify Now for Aadhaar?',
    answer:
      'No. Identity verification is optional on Setup Profile. You can verify with Aadhaar or corporate email, or skip and finish with Save and Continue. You can also verify later from Profile.',
  },
  {
    id: 'verify-then-what',
    question: 'What happens after I verify Aadhaar?',
    answer:
      'If your Setup Profile details are already complete, you can continue to Home. If any required field is still empty, you will return to Setup Profile to finish those details before continuing.',
  },
  {
    id: 'save-disabled',
    question: 'Why is Save and Continue disabled?',
    answer:
      'The button stays disabled until Full Name (at least 3 characters) and a valid email are filled. Fix any field errors shown under the inputs, then try again.',
  },
  {
    id: 'edit-later',
    question: 'Can I edit my profile details later?',
    answer:
      'Yes. After you reach Home, open Profile to update your photo, name, and other account details. Some identity changes may ask you to verify again for security.',
  },
] as const;

export const getAuthFaqItems = (topic: AuthFaqTopic): readonly AuthFaqItem[] =>
  topic === 'profile' ? PROFILE_FAQ_ITEMS : AUTH_FAQ_ITEMS;

export const getAuthFaqSubtitle = (topic: AuthFaqTopic): string =>
  topic === 'profile' ? AUTH_FAQ_SCREEN.profile.subtitle : AUTH_FAQ_SCREEN.auth.subtitle;
