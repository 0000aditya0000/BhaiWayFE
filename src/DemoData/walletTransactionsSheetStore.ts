import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  WALLET_TRANSACTIONS_SHEET_HEADERS,
  WALLET_TRANSACTIONS_SHEET_ID_START,
  type WalletTransactionSheetIcon,
  type WalletTransactionSheetType,
  type WalletTransactionsSheetPatch,
  type WalletTransactionsSheetRow,
} from './walletTransactionsSheet.types';

const store = createLocalListStore<WalletTransactionsSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.walletTransactionsSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeType = (value?: string | null): WalletTransactionSheetType =>
  (value ?? '').trim().toLowerCase() === 'debit' ? 'debit' : 'credit';

const normalizeIcon = (value?: string | null): WalletTransactionSheetIcon => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'car' || key === 'business' || key === 'star') {
    return key;
  }
  return 'card';
};

const emptyRow = (
  rowId: number,
  transactionId: number,
  userId: number,
  mobile: string,
): WalletTransactionsSheetRow => ({
  row_id: rowId,
  transactionId,
  userId,
  mobile,
  title: '',
  amount: 0,
  type: 'credit',
  icon: 'card',
  dateLabel: '',
  reference: '',
  createdAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<WalletTransactionsSheetRow> & { row_id: number },
): WalletTransactionsSheetRow => ({
  row_id: row.row_id,
  transactionId: Number(row.transactionId) || 0,
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  title: row.title ?? '',
  amount: Number(row.amount) || 0,
  type: normalizeType(row.type),
  icon: normalizeIcon(row.icon),
  dateLabel: row.dateLabel ?? '',
  reference: row.reference ?? '',
  createdAt: row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const walletTransactionsSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: WalletTransactionsSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextTransactionId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.transactionId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= WALLET_TRANSACTIONS_SHEET_ID_START);
    if (ids.length === 0) {
      return WALLET_TRANSACTIONS_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByTransactionId: (transactionId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find((row) => row.transactionId === transactionId),

  getByMobile: (mobile?: string | null) => {
    const key = normalizeMobile(mobile);
    if (!key) {
      return [];
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => normalizeMobile(row.mobile) === key)
      .sort((a, b) => b.transactionId - a.transactionId);
  },

  getForCurrentUser: (): WalletTransactionsSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return walletTransactionsSheetStore.getByMobile(phone);
  },

  upsert: async (patch: WalletTransactionsSheetPatch): Promise<WalletTransactionsSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;

    const existing =
      (patch.transactionId && patch.transactionId > 0
        ? store.getAll().find((row) => row.transactionId === patch.transactionId)
        : undefined) ||
      (patch.row_id ? store.getById(patch.row_id) : undefined);

    if (existing) {
      const merged: WalletTransactionsSheetRow = {
        ...normalizeStoredRow(existing),
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        title: patch.title?.trim() || existing.title,
        amount: patch.amount !== undefined ? Number(patch.amount) || 0 : existing.amount,
        type: patch.type ? normalizeType(patch.type) : existing.type,
        icon: patch.icon ? normalizeIcon(patch.icon) : existing.icon,
        dateLabel: patch.dateLabel?.trim() || existing.dateLabel,
        reference: patch.reference?.trim() || existing.reference,
        createdAt: existing.createdAt || new Date().toISOString(),
        transactionId:
          existing.transactionId > 0
            ? existing.transactionId
            : walletTransactionsSheetStore.nextTransactionId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const transactionId =
      patch.transactionId && patch.transactionId >= WALLET_TRANSACTIONS_SHEET_ID_START
        ? patch.transactionId
        : walletTransactionsSheetStore.nextTransactionId();

    const base = emptyRow(
      store.nextId(),
      transactionId,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      title: patch.title?.trim() || '',
      amount: Number(patch.amount) || 0,
      type: normalizeType(patch.type),
      icon: normalizeIcon(patch.icon),
      dateLabel: patch.dateLabel?.trim() || '',
      reference: patch.reference?.trim() || '',
      createdAt: patch.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  headers: WALLET_TRANSACTIONS_SHEET_HEADERS,
};
