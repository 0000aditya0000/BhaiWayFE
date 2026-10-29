import type { ProfileSuccessKind } from '../types';

export const PROFILE_SUCCESS_SCREEN = {
  brandTitle: 'BhaiWay',
  bankAdded: {
    kind: 'bank-account-added' as const satisfies ProfileSuccessKind,
    title: 'Account Added Successfully',
    subtitle:
      'Your bank account has been linked successfully. You can now proceed with your transactions.',
    bankLabel: 'Default Bank',
    defaultMaskedNumber: '•••• 4242',
    defaultBankName: 'Linked Bank',
    primaryLabel: 'Continue to Withdrawal',
    secondaryLabel: 'View Payment Methods',
  },
  withdrawal: {
    kind: 'withdrawal-initiated' as const satisfies ProfileSuccessKind,
    title: 'Withdrawal Initiated',
    referenceLabel: 'Reference Number',
    defaultAmountLabel: '500',
    defaultBankName: 'HDFC Bank',
    defaultMaskedNumber: '****1234',
    defaultReferenceNumber: 'BW-REF-98742210',
    primaryLabel: 'Go to Wallet',
    copiedMessage: 'Reference number copied.',
  },
} as const;
