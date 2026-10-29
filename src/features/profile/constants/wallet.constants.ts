import type {
  WalletTransaction,
  WalletTransactionFilter,
} from '../types';

export const WALLET_SCREEN = {
  title: 'My Wallet',
  coinRateHint: '1 Coin = ₹1',
  totalBalanceLabel: 'Total balance',
  availableLabel: 'Available',
  heldLabel: 'Held',
  withdrawableLabel: 'Withdrawable',
  bucketsTitle: 'Coin buckets',
  heldNotice:
    'Some coins are temporarily held for active rides or Assured deposits.',
  addCoinsLabel: 'Add coins',
  withdrawLabel: 'Withdraw',
  withdrawalHistoryLabel: 'Withdrawal History',
  paymentMethodsLabel: 'Payment Methods',
  transactionsTitle: 'Recent activity',
  viewAllLabel: 'See all',
  emptyTransactionsTitle: 'No transactions yet',
  emptyTransactionsMessage: 'Your wallet activity will show up here.',
  emptyWalletTitle: 'Your wallet is empty',
  emptyWalletMessage: 'Add coins to pay for rides seamlessly.',
  loadErrorTitle: 'Unable to load wallet',
  loadErrorMessage: 'Check your connection and try again.',
  retryLabel: 'Retry',
  coinsSuffix: 'coins',
} as const;

export const WALLET_FILTERS: readonly {
  id: WalletTransactionFilter;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credit' },
  { id: 'debit', label: 'Debit' },
];

export const WALLET_RECENT_TRANSACTION_LIMIT = 10;

/** @deprecated Demo-only transactions — production uses GET /wallet/transactions. */
export const WALLET_TRANSACTIONS: readonly WalletTransaction[] = [];

export const DEFAULT_WALLET_SUMMARY = {
  balanceLabel: '0 Coins',
  walletId: '',
  walletName: 'BhaiWay Coins Wallet',
} as const;
