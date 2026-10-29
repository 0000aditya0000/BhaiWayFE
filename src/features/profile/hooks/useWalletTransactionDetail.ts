import { useCallback, useState } from 'react';

import { triggerLightHaptic } from '@/shared/utils';

import type { WalletTransaction } from '../types';

export interface UseWalletTransactionDetailResult {
  selectedTransaction: WalletTransaction | null;
  isDetailOpen: boolean;
  openTransaction: (transaction: WalletTransaction) => void;
  closeTransaction: () => void;
}

export const useWalletTransactionDetail = (): UseWalletTransactionDetailResult => {
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);

  const openTransaction = useCallback((transaction: WalletTransaction) => {
    triggerLightHaptic();
    setSelectedTransaction(transaction);
  }, []);

  const closeTransaction = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  return {
    selectedTransaction,
    isDetailOpen: selectedTransaction !== null,
    openTransaction,
    closeTransaction,
  };
};
