import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { listWithdrawals, type WithdrawalDto } from '../api/withdrawals.api';
import type { WithdrawalsPageDto } from '../api/withdrawals.types';
import { WITHDRAWAL_HISTORY_SCREEN } from '../constants/withdrawal-history.constants';
import { mapWithdrawalError } from '../utils/withdrawals.mapper';
import { triggerLightHaptic } from '@/shared/utils';

export interface UseWithdrawalsResult {
  title: string;
  emptyTitle: string;
  emptySubtitle: string;
  items: WithdrawalDto[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  goBack: () => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  retry: () => void;
  openDetails: (id: string) => void;
}

const PAGE_SIZE = 20;

export const useWithdrawals = (): UseWithdrawalsResult => {
  const router = useRouter();
  const [items, setItems] = useState<WithdrawalDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const fetchPage = useCallback(async (pageToLoad: number, mode: 'initial' | 'append' | 'refresh') => {
    if (inflightRef.current) {
      return;
    }
    inflightRef.current = true;
    if (mode === 'append') {
      setLoadingMore(true);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const listParams = { page: pageToLoad, limit: PAGE_SIZE };
      const force = mode === 'refresh' || mode === 'append';
      const result = await resourceCache.query<WithdrawalsPageDto>({
        key: cacheKeys.withdrawals.list(listParams),
        staleTime: CACHE_STALE_TIMES.WITHDRAWALS,
        force,
        fetcher: () => listWithdrawals(listParams),
      });
      setItems((prev) =>
        mode === 'append' ? [...prev, ...result.data.items] : result.data.items,
      );
      setPage(result.data.page);
      setTotalPages(result.data.totalPages);
      setError(null);
    } catch (err) {
      const kept = resourceCache.peek<WithdrawalsPageDto>(
        cacheKeys.withdrawals.list({ page: 1, limit: PAGE_SIZE }),
      );
      if (mode !== 'append' && kept) {
        setItems(kept.items);
        setPage(kept.page);
        setTotalPages(kept.totalPages);
        setError(null);
      } else {
        setError(mapWithdrawalError(err));
        if (mode !== 'append') {
          setItems([]);
        }
      }
    } finally {
      inflightRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchPage(1, 'initial');
    }, [fetchPage]),
  );

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  return {
    title: WITHDRAWAL_HISTORY_SCREEN.title,
    emptyTitle: WITHDRAWAL_HISTORY_SCREEN.emptyTitle,
    emptySubtitle: WITHDRAWAL_HISTORY_SCREEN.emptySubtitle,
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: page < totalPages,
    goBack,
    refresh: () => fetchPage(1, 'refresh'),
    loadMore: () => {
      if (page < totalPages) {
        void fetchPage(page + 1, 'append');
      }
    },
    retry: () => {
      void fetchPage(1, 'initial');
    },
    openDetails: (id: string) => {
      triggerLightHaptic();
      router.push({ pathname: ROUTES.withdrawalDetails, params: { id } });
    },
  };
};
