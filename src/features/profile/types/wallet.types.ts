export type WalletTransactionType = 'credit' | 'debit';

export type WalletTransactionFilter = 'all' | 'credit' | 'debit';

export type WalletTransactionIcon = 'car' | 'card' | 'business' | 'star';

export type WalletTransactionIconTone = 'credit' | 'debit' | 'primary' | 'neutral';

export interface WalletTransaction {
  id: string;
  title: string;
  /** Ride ID + type line — only when backend omits displayTitle but sends ride fields. */
  subtitle?: string;
  dateLabel: string;
  amountLabel: string;
  type: WalletTransactionType;
  icon: WalletTransactionIcon;
  iconTone: WalletTransactionIconTone;
  displayCategory?: string;
  status?: string;
  transactionType?: string;
  pointSource?: string | null;
  /** Raw API fields for detail modal */
  amount: string;
  direction: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
  referenceType?: string | null;
  referenceId?: string | null;
  rideId?: string | null;
  rideType?: string | null;
}

export interface WalletBucketSummary {
  label: string;
  availableCoins: string;
  heldCoins: string;
  availableLabel: string;
  heldLabel: string;
}

export interface WalletBucketSummary {
  label: string;
  availableCoins: string;
  heldCoins: string;
  availableLabel: string;
  heldLabel: string;
}

export interface WalletSummary {
  balanceCoins: string;
  availableCoins: string;
  heldCoins: string;
  withdrawableCoins: string;
  nonWithdrawableCoins: string;
  balanceLabel: string;
  availableLabel: string;
  heldLabel: string;
  buckets: {
    purchased: WalletBucketSummary;
    promotional: WalletBucketSummary;
    driverEarned: WalletBucketSummary;
  };
}

/** @deprecated Legacy demo summary shape — prefer WalletSummary from API. */
export interface LegacyWalletSummary {
  balanceLabel: string;
  walletId: string;
  walletName: string;
}
