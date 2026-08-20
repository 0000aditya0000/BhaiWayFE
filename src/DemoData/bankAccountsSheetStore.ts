import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  BANK_ACCOUNTS_SHEET_HEADERS,
  BANK_ACCOUNTS_SHEET_ID_START,
  type BankAccountSheetStatus,
  type BankAccountsSheetPatch,
  type BankAccountsSheetRow,
} from './bankAccountsSheet.types';

const store = createLocalListStore<BankAccountsSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.bankAccountsSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeStatus = (value?: string | null): BankAccountSheetStatus =>
  (value ?? '').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active';

const emptyRow = (
  rowId: number,
  bankAccountId: number,
  userId: number,
  mobile: string,
): BankAccountsSheetRow => ({
  row_id: rowId,
  bankAccountId,
  userId,
  mobile,
  holderName: '',
  bankName: '',
  accountNumber: '',
  accountLast4: '',
  ifsc: '',
  accountType: 'Savings Account',
  status: 'active',
  createdAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<BankAccountsSheetRow> & { row_id: number },
): BankAccountsSheetRow => ({
  row_id: row.row_id,
  bankAccountId: Number(row.bankAccountId) || 0,
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  holderName: row.holderName ?? '',
  bankName: row.bankName ?? '',
  accountNumber: row.accountNumber ?? '',
  accountLast4: row.accountLast4 ?? '',
  ifsc: row.ifsc ?? '',
  accountType: row.accountType ?? 'Savings Account',
  status: normalizeStatus(row.status),
  createdAt: row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const bankAccountsSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: BankAccountsSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextBankAccountId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.bankAccountId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= BANK_ACCOUNTS_SHEET_ID_START);
    if (ids.length === 0) {
      return BANK_ACCOUNTS_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByBankAccountId: (bankAccountId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find((row) => row.bankAccountId === bankAccountId),

  getByMobile: (mobile?: string | null) => {
    const key = normalizeMobile(mobile);
    if (!key) {
      return [];
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => normalizeMobile(row.mobile) === key)
      .filter((row) => row.status === 'active')
      .sort((a, b) => b.bankAccountId - a.bankAccountId);
  },

  getForCurrentUser: (): BankAccountsSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return bankAccountsSheetStore.getByMobile(phone);
  },

  upsert: async (patch: BankAccountsSheetPatch): Promise<BankAccountsSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;

    const existing =
      (patch.bankAccountId && patch.bankAccountId > 0
        ? store.getAll().find((row) => row.bankAccountId === patch.bankAccountId)
        : undefined) ||
      (patch.row_id ? store.getById(patch.row_id) : undefined);

    if (existing) {
      const merged: BankAccountsSheetRow = {
        ...normalizeStoredRow(existing),
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        holderName: patch.holderName?.trim() || existing.holderName,
        bankName: patch.bankName?.trim() || existing.bankName,
        accountNumber: patch.accountNumber?.trim() || existing.accountNumber,
        accountLast4: patch.accountLast4?.trim() || existing.accountLast4,
        ifsc: patch.ifsc?.trim().toUpperCase() || existing.ifsc,
        accountType: patch.accountType?.trim() || existing.accountType,
        status: patch.status ? normalizeStatus(patch.status) : existing.status,
        createdAt: existing.createdAt || new Date().toISOString(),
        bankAccountId:
          existing.bankAccountId > 0
            ? existing.bankAccountId
            : bankAccountsSheetStore.nextBankAccountId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const bankAccountId =
      patch.bankAccountId && patch.bankAccountId >= BANK_ACCOUNTS_SHEET_ID_START
        ? patch.bankAccountId
        : bankAccountsSheetStore.nextBankAccountId();

    const base = emptyRow(
      store.nextId(),
      bankAccountId,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    const accountNumber = patch.accountNumber?.replace(/\D/g, '') || '';
    const accountLast4 =
      patch.accountLast4?.trim() ||
      (accountNumber.length >= 4 ? accountNumber.slice(-4) : accountNumber);

    return store.save({
      ...base,
      holderName: patch.holderName?.trim() || '',
      bankName: patch.bankName?.trim() || '',
      accountNumber,
      accountLast4,
      ifsc: patch.ifsc?.trim().toUpperCase() || '',
      accountType: patch.accountType?.trim() || 'Savings Account',
      status: normalizeStatus(patch.status),
      createdAt: patch.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  headers: BANK_ACCOUNTS_SHEET_HEADERS,
};
