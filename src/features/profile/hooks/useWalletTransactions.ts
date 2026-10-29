import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { listWalletTransactions, mapWalletApiError } from '../api/wallet.api';
import { triggerLightHaptic } from '@/shared/utils';
import { WALLET_TRANSACTIONS_SCREEN } from '../constants/wallet-transactions.constants';
import type { WalletTransaction, WalletTransactionFilter } from '../types';
import { mapWalletTransactionDto } from '../utils/mapWalletBalance';
import { useWalletTransactionDetail } from './useWalletTransactionDetail';

export interface UseWalletTransactionsResult {
  title: string;
  subtitle: string;
  filters: typeof WALLET_TRANSACTIONS_SCREEN.filters;
  activeFilter: WalletTransactionFilter;
  transactions: readonly WalletTransaction[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  selectedTransaction: WalletTransaction | null;
  isTransactionDetailOpen: boolean;
  setFilter: (filter: WalletTransactionFilter) => void;
  loadMore: () => void;
  retry: () => void;
  openTransaction: (transaction: WalletTransaction) => void;
  closeTransaction: () => void;
  goBack: () => void;
}

const PAGE_SIZE = 20;

export const useWalletTransactions = (): UseWalletTransactionsResult => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<WalletTransactionFilter>('all');
  const [items, setItems] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const {
    selectedTransaction,
    isDetailOpen,
    openTransaction,
    closeTransaction,
  } = useWalletTransactionDetail();

  const fetchPage = useCallback(async (pageToLoad: number, append: boolean) => {
    if (inflightRef.current) {
      return;
    }
    inflightRef.current = true;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await listWalletTransactions({ page: pageToLoad, limit: PAGE_SIZE });
      const mapped = result.items.map(mapWalletTransactionDto);
      setItems((prev) => (append ? [...prev, ...mapped] : mapped));
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(mapWalletApiError(err));
      if (!append) {
        setItems([]);
      }
    } finally {
      inflightRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchPage(1, false);
    }, [fetchPage]),
  );

  useEffect(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  const transactions = useMemo(() => {
    if (activeFilter === 'all') {
      return items;
    }
    return items.filter((tx) => tx.type === activeFilter);
  }, [activeFilter, items]);

  const hasMore = page < totalPages;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  const setFilter = useCallback((filter: WalletTransactionFilter) => {
    triggerLightHaptic();
    setActiveFilter(filter);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    void fetchPage(page + 1, true);
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  const retry = useCallback(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  return {
    title: WALLET_TRANSACTIONS_SCREEN.title,
    subtitle: WALLET_TRANSACTIONS_SCREEN.subtitle,
    filters: WALLET_TRANSACTIONS_SCREEN.filters,
    activeFilter,
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    selectedTransaction,
    isTransactionDetailOpen: isDetailOpen,
    setFilter,
    loadMore,
    retry,
    openTransaction,
    closeTransaction,
    goBack,
  };
};
