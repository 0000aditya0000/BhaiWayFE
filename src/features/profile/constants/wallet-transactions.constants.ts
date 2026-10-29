export const WALLET_TRANSACTIONS_SCREEN = {
  title: 'All Transactions',
  subtitle: 'Complete history of credits and debits in your BhaiWay Coins Wallet.',
  emptyTitle: 'No transactions yet',
  emptyMessage: 'Your BhaiWay Coin activity will appear here.',
  errorTitle: 'Unable to load transactions',
  retryLabel: 'Retry',
  loadMoreLabel: 'Load more',
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'credit' as const, label: 'Credit' },
    { id: 'debit' as const, label: 'Debit' },
  ],
} as const;

