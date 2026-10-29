export const PAYMENT_METHODS_SCREEN = {
  title: 'Payment Methods',
  heroTitle: 'Payment Methods',
  heroSubtitle: 'Choose where you want to receive your withdrawals.',
  emptyTitle: 'No payment method added yet.',
  emptySubtitle: 'Add a UPI ID or bank account to receive withdrawals.',
  addLabel: 'Add Payment Method',
  activeBadge: 'Active',
  inactiveBadge: 'Inactive',
  removeTitle: 'Remove Payment Method?',
  removeMessage: 'Are you sure you want to remove this payment method?',
  removeCancel: 'Cancel',
  removeConfirm: 'Remove',
  removedTitle: 'Removed',
  removedMessage: 'Payment method removed.',
  loadingLabel: 'Loading payment methods…',
  retryLabel: 'Retry',
  ifscLabel: 'IFSC',
  holderLabel: 'Account holder',
} as const;

export const ADD_PAYMENT_METHOD_SCREEN = {
  title: 'Add Payment Method',
  chooseTitle: 'Choose payment method',
  upiOption: 'UPI',
  bankOption: 'Bank Account',
  upiTitle: 'UPI ID',
  upiPlaceholder: 'yourname@upi',
  upiHint: 'Example: yourname@upi',
  addUpiLabel: 'Add UPI',
  addingUpiLabel: 'Adding payment method…',
  bankTitle: 'Bank Account',
  holderLabel: 'Account Holder Name',
  bankNameLabel: 'Bank Name',
  accountLabel: 'Account Number',
  confirmAccountLabel: 'Confirm Account Number',
  ifscLabel: 'IFSC Code',
  addBankLabel: 'Add Bank Account',
  addingBankLabel: 'Adding payment method…',
  successTitle: 'Payment method added',
  successMessage: 'Payment method added successfully.',
} as const;

export type PaymentMethodReturnTo = 'payment-methods' | 'withdraw' | '';

export const getAddPaymentMethodPath = (params?: {
  type?: 'UPI' | 'BANK_ACCOUNT' | '';
  returnTo?: PaymentMethodReturnTo;
}) => ({
  pathname: '/add-payment-method' as const,
  params: {
    type: params?.type ?? '',
    returnTo: params?.returnTo ?? '',
  },
});

/** @deprecated Prefer getAddPaymentMethodPath for withdrawal payout methods. */
export const getLinkUpiPath = (params?: {
  mode?: 'add' | 'edit';
  savedUpiId?: string;
  returnTo?: 'payment-methods';
}) => ({
  pathname: '/link-upi' as const,
  params: {
    mode: params?.mode ?? 'add',
    savedUpiId: params?.savedUpiId ?? '',
    returnTo: params?.returnTo ?? '',
  },
});

/** @deprecated Prefer getAddPaymentMethodPath for withdrawal payout methods. */
export const getAddBankAccountPath = (params?: {
  mode?: 'add' | 'edit';
  bankAccountId?: string;
  returnTo?: 'payment-methods';
}) => ({
  pathname: '/add-bank-account' as const,
  params: {
    mode: params?.mode ?? 'add',
    bankAccountId: params?.bankAccountId ?? '',
    returnTo: params?.returnTo ?? '',
  },
});
