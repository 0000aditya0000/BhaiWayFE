import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getErrorMessage, triggerLightHaptic } from '@/shared/utils';
import { authSession } from '@/store';

import { listSupportTickets } from '../api/support.api';
import type {
  SupportTicketCategory,
  SupportTicketListItemDto,
  SupportTicketPageDto,
  SupportTicketStatus,
} from '../api/support.types';
import { mergeSupportTicketsWithoutDuplicates } from '../utils/support.mapper';

const PAGE_SIZE = 20;

export interface UseSupportTicketsResult {
  items: SupportTicketListItemDto[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  statusFilter: SupportTicketStatus | 'ALL';
  categoryFilter: SupportTicketCategory | 'ALL';
  setStatusFilter: (value: SupportTicketStatus | 'ALL') => void;
  setCategoryFilter: (value: SupportTicketCategory | 'ALL') => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  retry: () => void;
  openTicket: (ticketId: string) => void;
  goBack: () => void;
}

export const useSupportTickets = (): UseSupportTicketsResult => {
  const router = useRouter();
  const [items, setItems] = useState<SupportTicketListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilterState] = useState<SupportTicketStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilterState] = useState<SupportTicketCategory | 'ALL'>(
    'ALL',
  );
  const inflightRef = useRef(false);

  const applyPage = useCallback(
    (pageResult: SupportTicketPageDto, mode: 'replace' | 'append') => {
      setPage(pageResult.page);
      setTotalPages(pageResult.totalPages);
      setItems((prev) =>
        mode === 'append'
          ? mergeSupportTicketsWithoutDuplicates(prev, pageResult.items)
          : pageResult.items,
      );
    },
    [],
  );

  const fetchPage = useCallback(
    async (
      mode: 'initial' | 'refresh' | 'append',
      nextPage: number,
      status: SupportTicketStatus | 'ALL',
      category: SupportTicketCategory | 'ALL',
    ) => {
      if (!authSession.isAuthenticated()) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setError(null);
        return;
      }
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
        const listParams = {
          page: nextPage,
          limit: PAGE_SIZE,
          ...(status !== 'ALL' ? { status } : {}),
          ...(category !== 'ALL' ? { category } : {}),
        };
        const pageResult = await resourceCache.query<SupportTicketPageDto>({
          key: cacheKeys.support.tickets(listParams),
          staleTime: CACHE_STALE_TIMES.SUPPORT_TICKETS,
          force: mode !== 'initial',
          fetcher: () => listSupportTickets(listParams),
        });
        applyPage(pageResult.data, mode === 'append' ? 'append' : 'replace');
        setError(null);
      } catch (err) {
        if (mode === 'append') {
          setError(getErrorMessage(err));
        } else {
          setError(getErrorMessage(err));
          if (mode === 'initial') {
            setItems([]);
          }
        }
      } finally {
        inflightRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [applyPage],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchPage('initial', 1, statusFilter, categoryFilter);
    }, [fetchPage, statusFilter, categoryFilter]),
  );

  const refresh = useCallback(async () => {
    resourceCache.invalidate(cacheKeys.support.tickets());
    await fetchPage('refresh', 1, statusFilter, categoryFilter);
  }, [fetchPage, statusFilter, categoryFilter]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || page >= totalPages) {
      return;
    }
    void fetchPage('append', page + 1, statusFilter, categoryFilter);
  }, [
    fetchPage,
    loading,
    refreshing,
    loadingMore,
    page,
    totalPages,
    statusFilter,
    categoryFilter,
  ]);

  const retry = useCallback(() => {
    void fetchPage('initial', 1, statusFilter, categoryFilter);
  }, [fetchPage, statusFilter, categoryFilter]);

  const setStatusFilter = useCallback((value: SupportTicketStatus | 'ALL') => {
    setStatusFilterState(value);
  }, []);

  const setCategoryFilter = useCallback((value: SupportTicketCategory | 'ALL') => {
    setCategoryFilterState(value);
  }, []);

  const openTicket = useCallback(
    (ticketId: string) => {
      triggerLightHaptic();
      router.push({
        pathname: ROUTES.supportTicketDetail,
        params: { ticketId },
      });
    },
    [router],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.helpSupport);
  }, [router]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: page < totalPages,
    statusFilter,
    categoryFilter,
    setStatusFilter,
    setCategoryFilter,
    refresh,
    loadMore,
    retry,
    openTicket,
    goBack,
  };
};
