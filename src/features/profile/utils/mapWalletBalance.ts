import type { WalletBalanceDto, WalletTransactionDto } from '../api/wallet.types';
import type { WalletBucketSummary, WalletSummary, WalletTransaction } from '../types';
import { formatCoinString, formatCoinsLabel, formatSignedCoinString } from './walletCoin';
import {
  formatTransactionDateLabel,
  mapTransactionDirectionType,
  mapWalletTransactionDisplay,
  mapWalletTransactionVisual,
} from './mapWalletTransaction';

export const mapWalletBalanceToSummary = (dto: WalletBalanceDto): WalletSummary => ({
  balanceCoins: dto.balanceCoins,
  availableCoins: dto.availableCoins,
  heldCoins: dto.heldCoins,
  withdrawableCoins: dto.withdrawableCoins,
  nonWithdrawableCoins: dto.nonWithdrawableCoins,
  balanceLabel: formatCoinsLabel(dto.balanceCoins),
  availableLabel: formatCoinsLabel(dto.availableCoins),
  heldLabel: formatCoinsLabel(dto.heldCoins),
  buckets: {
    purchased: {
      label: 'Purchased',
      availableCoins: dto.buckets.purchased.availableCoins,
      heldCoins: dto.buckets.purchased.heldCoins,
      availableLabel: formatCoinString(dto.buckets.purchased.availableCoins),
      heldLabel: formatCoinString(dto.buckets.purchased.heldCoins),
    },
    promotional: {
      label: 'Promotional',
      availableCoins: dto.buckets.promotional.availableCoins,
      heldCoins: dto.buckets.promotional.heldCoins,
      availableLabel: formatCoinString(dto.buckets.promotional.availableCoins),
      heldLabel: formatCoinString(dto.buckets.promotional.heldCoins),
    },
    driverEarned: {
      label: 'Driver Earned',
      availableCoins: dto.buckets.driverEarned.availableCoins,
      heldCoins: dto.buckets.driverEarned.heldCoins,
      availableLabel: formatCoinString(dto.buckets.driverEarned.availableCoins),
      heldLabel: formatCoinString(dto.buckets.driverEarned.heldCoins),
    },
  },
});

export const mapWalletTransactionDto = (dto: WalletTransactionDto): WalletTransaction => {
  const type = mapTransactionDirectionType(dto.direction);
  const display = mapWalletTransactionDisplay(dto);
  const visual = mapWalletTransactionVisual(dto);
  return {
    id: dto.transactionId,
    title: display.title,
    subtitle: display.subtitle,
    dateLabel: formatTransactionDateLabel(dto.createdAt),
    amountLabel: formatSignedCoinString(dto.amount, dto.direction),
    type,
    icon: visual.icon,
    iconTone: visual.iconTone,
    displayCategory: dto.displayCategory ?? undefined,
    status: dto.status,
    transactionType: dto.transactionType,
    pointSource: dto.pointSource ?? null,
    amount: dto.amount,
    direction: dto.direction,
    balanceBefore: dto.balanceBefore,
    balanceAfter: dto.balanceAfter,
    createdAt: dto.createdAt,
    referenceType: dto.referenceType,
    referenceId: dto.referenceId,
    rideId: dto.rideId ?? null,
    rideType: dto.rideType ?? null,
  };
};

export const mapWalletBucketSummaries = (
  summary: WalletSummary,
): readonly WalletBucketSummary[] => [
  summary.buckets.purchased,
  summary.buckets.promotional,
  summary.buckets.driverEarned,
];
