import type { AddMoneyQuickAmount } from '../types';

export const ADD_MONEY_SCREEN = {
  title: 'Add Coins',
  amountLabel: 'Enter amount',
  amountPlaceholder: '0',
  coinsPreviewLabel: 'You will receive',
  rupeeHint: '1 Coin = ₹1',
  submitLabel: 'Add Coins',
  invalidAmountTitle: 'Invalid Amount',
  invalidAmountMessage: 'Enter an amount greater than zero to continue.',
  topUpFailedTitle: 'Unable to add Coins',
  topUpConflictTitle: 'Payment conflict',
  topUpConflictMessage:
    'This payment attempt conflicted with a previous request. Please try again.',
} as const;

/** Preset top-up amounts in integer Coins (₹1 = 1 Coin). */
export const ADD_MONEY_QUICK_AMOUNTS: readonly AddMoneyQuickAmount[] = [
  { id: '100', amount: '100', label: '₹100' },
  { id: '250', amount: '250', label: '₹250' },
  { id: '500', amount: '500', label: '₹500' },
  { id: '1000', amount: '1000', label: '₹1,000' },
  { id: '2000', amount: '2000', label: '₹2,000' },
];

export const DEFAULT_ADD_MONEY_AMOUNT = '';
