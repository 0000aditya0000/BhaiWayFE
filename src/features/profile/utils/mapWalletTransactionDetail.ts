import { WALLET_TRANSACTION_DETAIL } from '../constants/wallet-transaction-detail.constants';
import type { WalletTransaction } from '../types';
import { formatCoinString } from './walletCoin';
import { formatTransactionDateLabel, mapPointSourceLabel } from './mapWalletTransaction';

export interface WalletTransactionDetailRow {
  label: string;
  value: string;
  mono?: boolean;
}

const asDisplay = (value: string | null | undefined): string => {
  const trimmed = String(value ?? '').trim();
  return trimmed || WALLET_TRANSACTION_DETAIL.notAvailable;
};

const formatCategoryLabel = (category: string | undefined): string => {
  const key = String(category ?? '').trim();
  if (!key) {
    return WALLET_TRANSACTION_DETAIL.notAvailable;
  }
  return key
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatRideTypeLabel = (rideType: string | null | undefined): string => {
  const key = String(rideType ?? '').trim().toUpperCase();
  if (key === 'COMMUTE') {
    return 'Office Commute';
  }
  if (key === 'ASSURED') {
    return 'Assured';
  }
  if (key === 'REGULAR') {
    return 'Regular';
  }
  return asDisplay(rideType);
};

export const buildWalletTransactionDetailRows = (
  transaction: WalletTransaction,
): WalletTransactionDetailRow[] => {
  const isCredit = transaction.type === 'credit';
  const rows: WalletTransactionDetailRow[] = [
    {
      label: WALLET_TRANSACTION_DETAIL.amountLabel,
      value: `${transaction.amountLabel.replace(/^[+-]\s*/, '')} coins`,
    },
    {
      label: WALLET_TRANSACTION_DETAIL.directionLabel,
      value: isCredit
        ? WALLET_TRANSACTION_DETAIL.creditLabel
        : WALLET_TRANSACTION_DETAIL.debitLabel,
    },
    {
      label: WALLET_TRANSACTION_DETAIL.statusLabel,
      value: asDisplay(transaction.status),
    },
    {
      label: WALLET_TRANSACTION_DETAIL.typeLabel,
      value: asDisplay(transaction.transactionType),
    },
    {
      label: WALLET_TRANSACTION_DETAIL.categoryLabel,
      value: formatCategoryLabel(transaction.displayCategory),
    },
  ];

  const pointSource = mapPointSourceLabel(transaction.pointSource);
  if (pointSource) {
    rows.push({
      label: WALLET_TRANSACTION_DETAIL.pointSourceLabel,
      value: pointSource,
    });
  }

  rows.push(
    {
      label: WALLET_TRANSACTION_DETAIL.balanceBeforeLabel,
      value: `${formatCoinString(transaction.balanceBefore)} coins`,
    },
    {
      label: WALLET_TRANSACTION_DETAIL.balanceAfterLabel,
      value: `${formatCoinString(transaction.balanceAfter)} coins`,
    },
    {
      label: WALLET_TRANSACTION_DETAIL.dateLabel,
      value: formatTransactionDateLabel(transaction.createdAt) || transaction.dateLabel,
    },
  );

  if (transaction.referenceType) {
    rows.push({
      label: WALLET_TRANSACTION_DETAIL.referenceTypeLabel,
      value: asDisplay(transaction.referenceType),
    });
  }

  if (transaction.referenceId) {
    rows.push({
      label: WALLET_TRANSACTION_DETAIL.referenceIdLabel,
      value: asDisplay(transaction.referenceId),
      mono: true,
    });
  }

  if (transaction.rideId) {
    rows.push({
      label: WALLET_TRANSACTION_DETAIL.rideIdLabel,
      value: asDisplay(transaction.rideId),
      mono: true,
    });
  }

  if (transaction.rideType) {
    rows.push({
      label: WALLET_TRANSACTION_DETAIL.rideTypeLabel,
      value: formatRideTypeLabel(transaction.rideType),
    });
  }

  rows.push({
    label: WALLET_TRANSACTION_DETAIL.transactionIdLabel,
    value: transaction.id,
    mono: true,
  });

  return rows;
};
