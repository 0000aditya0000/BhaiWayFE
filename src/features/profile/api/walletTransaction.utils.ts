import type { WalletTransactionDto } from './wallet.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const readString = (record: Record<string, unknown> | null, ...keys: string[]): string | null => {
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return String(raw);
    }
  }
  return null;
};

/**
 * Normalizes GET /wallet/transactions items from API shape variants.
 * Does not invent rideId/rideType — only reads fields present on the payload.
 */
export const normalizeWalletTransactionDto = (raw: unknown): WalletTransactionDto | null => {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const transactionId =
    readString(record, 'transactionId', 'transaction_id', 'id', '_id') ?? '';
  if (!transactionId) {
    return null;
  }

  const ride = asRecord(record.ride);
  const referenceType =
    readString(record, 'referenceType', 'reference_type') ?? null;
  const referenceId =
    readString(record, 'referenceId', 'reference_id') ?? null;

  const rideId =
    readString(record, 'rideId', 'ride_id') ??
    readString(ride, 'id', 'rideId', 'ride_id') ??
    (referenceType?.toUpperCase() === 'RIDE' ? referenceId : null);

  const rideType =
    readString(record, 'rideType', 'ride_type') ??
    readString(ride, 'rideType', 'ride_type', 'type');

  return {
    transactionId,
    transactionType:
      readString(record, 'transactionType', 'transaction_type', 'type') ?? '',
    direction: readString(record, 'direction') ?? 'DEBIT',
    amount: readString(record, 'amount', 'amountCoins', 'amount_coins') ?? '0',
    balanceBefore:
      readString(record, 'balanceBefore', 'balance_before') ?? '0',
    balanceAfter: readString(record, 'balanceAfter', 'balance_after') ?? '0',
    pointSource:
      readString(record, 'pointSource', 'point_source') ?? null,
    status: readString(record, 'status') ?? 'POSTED',
    displayTitle:
      readString(record, 'displayTitle', 'display_title', 'title') ?? null,
    displayCategory:
      readString(record, 'displayCategory', 'display_category', 'category') ?? null,
    referenceType,
    referenceId,
    rideId: rideId ?? undefined,
    rideType: rideType ?? undefined,
    createdAt:
      readString(record, 'createdAt', 'created_at', 'timestamp') ??
      new Date(0).toISOString(),
  };
};

export const normalizeWalletTransactionList = (items: unknown[]): WalletTransactionDto[] =>
  items
    .map((item) => normalizeWalletTransactionDto(item))
    .filter((item): item is WalletTransactionDto => item !== null);
