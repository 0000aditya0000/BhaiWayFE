import type { WithdrawQuickAmount } from '../types';

export const WITHDRAW_SCREEN = {
  title: 'Withdraw',
  balanceLabel: 'Available to Withdraw',
  amountLabel: 'How much do you want to withdraw?',
  amountPlaceholder: '0',
  selectAccountLabel: 'Receive money via',
  addAccountTitle: 'Add Payment Method',
  addAccountSubtitle: 'Add a UPI ID or bank account',
  noMethodsTitle: 'No payment method added.',
  noMethodsSubtitle: 'Add a payment method to receive withdrawals.',
  proceedLabel: 'Withdraw',
  submittingLabel: 'Submitting…',
  maxLabel: 'Max',
  invalidAmountTitle: 'Invalid Amount',
  exceedBalanceTitle: 'Insufficient Balance',
  selectAccountTitle: 'Select Payment Method',
  selectAccountMessage: 'Choose a payment method to withdraw to.',
  successTitle: 'Withdrawal submitted',
  successMessage: 'Your withdrawal request has been submitted.',
  failedTitle: 'Withdrawal failed',
  timeoutTitle: 'Unable to confirm',
  checkStatusLabel: 'Check Status',
  retryLabel: 'Try Again',
  historyLabel: 'Withdrawal History',
} as const;

export const WITHDRAW_QUICK_AMOUNTS: readonly WithdrawQuickAmount[] = [
  { id: '500', amount: 500, label: '500' },
  { id: '1000', amount: 1000, label: '1000' },
  { id: '2000', amount: 2000, label: '2000' },
];

export const DEFAULT_WITHDRAW_AMOUNT = '';
