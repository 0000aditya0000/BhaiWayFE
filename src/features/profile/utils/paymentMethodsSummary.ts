import type { BankAccountsSheetRow } from '@/DemoData/bankAccountsSheet.types';
import type { SavedUpiId } from '@/features/ride-search/store';
import { DEFAULT_MASTER_PROFILE } from '../constants/profile.constants';

const maskAccount = (last4: string, accountNumber?: string): string => {
  const digits = last4 || accountNumber?.slice(-4) || '';
  return digits ? `•••• ${digits}` : '•••• ••••';
};

export const formatPaymentMethodsSubtitle = (
  upi: SavedUpiId | undefined,
  bank: BankAccountsSheetRow | undefined,
): string => {
  const parts: string[] = [];

  if (upi?.upiId) {
    parts.push(upi.upiId);
  }

  if (bank?.bankName) {
    const masked = maskAccount(bank.accountLast4, bank.accountNumber);
    parts.push(`${bank.bankName} ${masked}`);
  }

  if (parts.length === 0) {
    return DEFAULT_MASTER_PROFILE.paymentMethodsSubtitle;
  }

  return parts.join(' · ');
};
