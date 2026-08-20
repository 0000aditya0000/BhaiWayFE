import { formatSignedBhaiWayCoins } from '@/shared/utils';
import {
  WALLET_TRANSACTIONS_SHEET_ID_START,
} from '@/DemoData/files';
import { authSession } from '@/store';

import { userDetailsSheetStore } from '../userDetailsSheetStore';
import {
  type WalletTransactionSheetIcon,
  type WalletTransactionSheetType,
} from '../walletTransactionsSheet.types';
import { walletTransactionsSheetStore } from '../walletTransactionsSheetStore';

export interface RemoteWalletTransactionRow {
  transactionId: number;
  userId: number;
  mobile: string;
  title: string;
  amount: number;
  type: string;
  icon: string;
  dateLabel: string;
  reference: string;
  createdAt: string;
}

export interface WalletTransactionSyncInput {
  transactionId?: number;
  userId?: number;
  mobile?: string;
  title: string;
  amount: number;
  type: WalletTransactionSheetType;
  icon?: WalletTransactionSheetIcon;
  dateLabel?: string;
  reference?: string;
  createdAt?: string;
}

export interface WalletTransactionSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  transactionId: number;
  message: string;
}

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const resolveOwner = () => {
  const phone = normalizeMobile(authSession.getUser()?.phone);
  return (
    (phone ? userDetailsSheetStore.findByMobile(phone) : undefined) ||
    userDetailsSheetStore.getAll()[0]
  );
};

export const formatWalletTransactionDateLabel = (date = new Date()): string => {
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
};

export const formatWalletTransactionAmountLabel = (
  amount: number,
  type: WalletTransactionSheetType,
): string =>
  formatSignedBhaiWayCoins(Math.abs(amount), {
    sign: type === 'debit' ? '-' : '+',
  });

/** Local WalletTransactions persistence (device store). */
export const walletTransactionsSheetSync = {
  /** Hydrate the local WalletTransactions store. */
  pullIntoLocal: async (): Promise<RemoteWalletTransactionRow[]> => {
    await walletTransactionsSheetStore.hydrate();
    return [];
  },

  upsertAndSync: async (
    input: WalletTransactionSyncInput,
  ): Promise<WalletTransactionSyncResult> => {
    const amount = Math.abs(Number(input.amount) || 0);
    if (!input.title.trim() || amount <= 0) {
      throw Object.assign(new Error('Transaction title and amount are required.'), {
        code: 'WALLET_TX_VALIDATION_FAILED',
      });
    }

    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';

    const existing =
      input.transactionId && input.transactionId > 0
        ? walletTransactionsSheetStore.findByTransactionId(input.transactionId)
        : undefined;
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const transactionId =
      existing?.transactionId && existing.transactionId > 0
        ? existing.transactionId
        : input.transactionId && input.transactionId >= WALLET_TRANSACTIONS_SHEET_ID_START
          ? input.transactionId
          : walletTransactionsSheetStore.nextTransactionId();

    const saved = await walletTransactionsSheetStore.upsert({
      transactionId,
      userId: input.userId || owner?.userId || 0,
      mobile,
      title: input.title.trim(),
      amount,
      type: input.type,
      icon: input.icon || (input.type === 'debit' ? 'business' : 'card'),
      dateLabel: input.dateLabel || formatWalletTransactionDateLabel(),
      reference: input.reference,
      createdAt: input.createdAt,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      transactionId: saved.transactionId,
      message: `TransactionID ${saved.transactionId} saved locally.`,
    };
  },
};
