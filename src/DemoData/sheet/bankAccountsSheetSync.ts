import {
  BANK_ACCOUNTS_SHEET_ID_START,
} from '@/DemoData/files';
import { authSession } from '@/store';

import { userDetailsSheetStore } from '../userDetailsSheetStore';
import { bankAccountsSheetStore } from '../bankAccountsSheetStore';

export interface RemoteBankAccountRow {
  bankAccountId: number;
  userId: number;
  mobile: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
  accountLast4: string;
  ifsc: string;
  accountType: string;
  status: string;
  createdAt: string;
}

export interface BankAccountSyncInput {
  bankAccountId?: number;
  userId?: number;
  mobile?: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountType?: string;
  status?: string;
  createdAt?: string;
}

export interface BankAccountSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  bankAccountId: number;
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

/** Local BankAccounts persistence (device store). */
export const bankAccountsSheetSync = {
  /** Hydrate the local BankAccounts store. */
  pullIntoLocal: async (): Promise<RemoteBankAccountRow[]> => {
    await bankAccountsSheetStore.hydrate();
    return [];
  },

  upsertAndSync: async (input: BankAccountSyncInput): Promise<BankAccountSyncResult> => {
    const holderName = input.holderName.trim();
    const bankName = input.bankName.trim();
    const accountNumber = input.accountNumber.replace(/\D/g, '');
    const ifsc = input.ifsc.trim().toUpperCase();

    if (!holderName || !bankName || !accountNumber || !ifsc) {
      throw Object.assign(new Error('All bank account fields are required.'), {
        code: 'BANK_ACCOUNT_VALIDATION_FAILED',
      });
    }

    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';

    const existing =
      input.bankAccountId && input.bankAccountId > 0
        ? bankAccountsSheetStore.findByBankAccountId(input.bankAccountId)
        : undefined;
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const bankAccountId =
      existing?.bankAccountId && existing.bankAccountId > 0
        ? existing.bankAccountId
        : input.bankAccountId && input.bankAccountId >= BANK_ACCOUNTS_SHEET_ID_START
          ? input.bankAccountId
          : bankAccountsSheetStore.nextBankAccountId();

    const saved = await bankAccountsSheetStore.upsert({
      bankAccountId,
      userId: input.userId || owner?.userId || 0,
      mobile,
      holderName,
      bankName,
      accountNumber,
      accountLast4: accountNumber.slice(-4),
      ifsc,
      accountType: input.accountType?.trim() || 'Savings Account',
      status: input.status === 'inactive' ? 'inactive' : 'active',
      createdAt: input.createdAt,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      bankAccountId: saved.bankAccountId,
      message: `BankAccountID ${saved.bankAccountId} saved locally.`,
    };
  },
};
