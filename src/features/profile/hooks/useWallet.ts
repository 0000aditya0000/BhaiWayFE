import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { listWalletTransactions, mapWalletApiError } from '../api/wallet.api';
import type { WalletTransactionsPageDto } from '../api/wallet.types';
import { triggerLightHaptic } from '@/shared/utils';
import {
  WALLET_FILTERS,
  WALLET_RECENT_TRANSACTION_LIMIT,
} from '../constants';
import type { WalletTransaction, WalletTransactionFilter } from '../types';
import { mapWalletTransactionDto } from '../utils/mapWalletBalance';
import { isPositiveCoins } from '../utils/walletCoin';
import { walletStore } from '../store/walletStore';
import { walletTopUpReturnStore } from '../store/walletTopUpReturnStore';
import { useWalletBalance } from './useWalletBalance';
import { useWalletTransactionDetail } from './useWalletTransactionDetail';

const RECENT_TX_PARAMS = { page: 1, limit: WALLET_RECENT_TRANSACTION_LIMIT } as const;

export interface UseWalletResult {
  summary: ReturnType<typeof useWalletBalance>['summary'];
  loading: boolean;
  error: string | null;
  filters: typeof WALLET_FILTERS;
  activeFilter: WalletTransactionFilter;
  transactions: readonly WalletTransaction[];
  transactionsLoading: boolean;
  hasHeldCoins: boolean;
  refreshing: boolean;
  selectedTransaction: WalletTransaction | null;
  isTransactionDetailOpen: boolean;
  goBack: () => void;
  openNotifications: () => void;
  setFilter: (filter: WalletTransactionFilter) => void;
  withdraw: () => void;
  openWithdrawalHistory: () => void;
  openPaymentMethods: () => void;
  addCoins: () => void;
  viewAll: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
  openTransaction: (transaction: WalletTransaction) => void;
  closeTransaction: () => void;
}

export const useWallet = (): UseWalletResult => {
  const router = useRouter();
  const {
    summary,
    loading,
    error,
    refresh: refreshBalance,
    ensure: ensureBalance,
  } = useWalletBalance();
  const {
    selectedTransaction,
    isDetailOpen,
    openTransaction,
    closeTransaction,
  } = useWalletTransactionDetail();
  const [activeFilter, setActiveFilter] = useState<WalletTransactionFilter>('all');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const applyTransactionsPage = useCallback((page: WalletTransactionsPageDto) => {
    setTransactions(page.items.map(mapWalletTransactionDto));
  }, []);

  const ensureRecentTransactions = useCallback(async () => {
    const cached = resourceCache.peek<WalletTransactionsPageDto>(
      cacheKeys.wallet.transactions(RECENT_TX_PARAMS),
    );
    if (!cached) {
      setTransactionsLoading(true);
    }
    try {
      const result = await resourceCache.query({
        key: cacheKeys.wallet.transactions(RECENT_TX_PARAMS),
        staleTime: CACHE_STALE_TIMES.WALLET_TRANSACTIONS,
        fetcher: () =>
          listWalletTransactions({
            page: 1,
            limit: WALLET_RECENT_TRANSACTION_LIMIT,
          }),
      });
      applyTransactionsPage(result.data);
    } catch (err) {
      console.log('[Wallet] recent transactions failed', mapWalletApiError(err));
      if (!resourceCache.peek(cacheKeys.wallet.transactions(RECENT_TX_PARAMS))) {
        setTransactions([]);
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, [applyTransactionsPage]);

  const loadRecentTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const result = await resourceCache.query({
        key: cacheKeys.wallet.transactions(RECENT_TX_PARAMS),
        staleTime: CACHE_STALE_TIMES.WALLET_TRANSACTIONS,
        force: true,
        fetcher: () =>
          listWalletTransactions({
            page: 1,
            limit: WALLET_RECENT_TRANSACTION_LIMIT,
          }),
      });
      applyTransactionsPage(result.data);
    } catch (err) {
      console.log('[Wallet] recent transactions failed', mapWalletApiError(err));
      const kept = resourceCache.peek<WalletTransactionsPageDto>(
        cacheKeys.wallet.transactions(RECENT_TX_PARAMS),
      );
      if (kept) {
        applyTransactionsPage(kept);
      } else {
        setTransactions([]);
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, [applyTransactionsPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshBalance(), loadRecentTransactions()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadRecentTransactions, refreshBalance]);

  useFocusEffect(
    useCallback(() => {
      void ensureBalance();
      void ensureRecentTransactions();
    }, [ensureBalance, ensureRecentTransactions]),
  );

  const transactionsRefreshToken = useSyncExternalStore(
    walletStore.subscribe,
    () => walletStore.getSnapshot().transactionsRefreshToken,
    () => walletStore.getSnapshot().transactionsRefreshToken,
  );

  useEffect(() => {
    if (transactionsRefreshToken > 0) {
      void loadRecentTransactions();
    }
  }, [loadRecentTransactions, transactionsRefreshToken]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') {
      return transactions;
    }
    return transactions.filter((tx) => tx.type === activeFilter);
  }, [activeFilter, transactions]);

  const hasHeldCoins = useMemo(
    () => (summary ? isPositiveCoins(summary.heldCoins) : false),
    [summary],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.profile);
  }, [router]);

  const openNotifications = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.notifications);
  }, [router]);

  const setFilter = useCallback((filter: WalletTransactionFilter) => {
    triggerLightHaptic();
    setActiveFilter(filter);
  }, []);

  const withdraw = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.withdraw);
  }, [router]);

  const openWithdrawalHistory = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.withdrawalHistory);
  }, [router]);

  const openPaymentMethods = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.paymentMethods);
  }, [router]);

  const addCoins = useCallback(() => {
    triggerLightHaptic();
    // Clear any booking return target so wallet-initiated top-ups stay in wallet.
    walletTopUpReturnStore.clear();
    router.push(ROUTES.addMoney);
  }, [router]);

  const viewAll = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.walletTransactions);
  }, [router]);

  const retry = useCallback(() => {
    void refresh();
  }, [refresh]);

  return {
    summary,
    loading,
    error,
    filters: WALLET_FILTERS,
    activeFilter,
    transactions: filteredTransactions,
    transactionsLoading,
    hasHeldCoins,
    refreshing,
    selectedTransaction,
    isTransactionDetailOpen: isDetailOpen,
    goBack,
    openNotifications,
    setFilter,
    withdraw,
    openWithdrawalHistory,
    openPaymentMethods,
    addCoins,
    viewAll,
    refresh,
    retry,
    openTransaction,
    closeTransaction,
  };
};
