import { useCallback, useEffect, useRef, useState } from 'react';

import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getErrorMessage } from '@/shared/utils';
import { authSession } from '@/store';

import { listEligibleSupportRides } from '../api/support.api';
import type {
  EligibleSupportRideDto,
  EligibleSupportRidePageDto,
  SupportEligibleRidePeriod,
} from '../api/support.types';
import { mergeEligibleRidesWithoutDuplicates } from '../utils/support.mapper';

const PAGE_SIZE = 20;

export interface UseEligibleSupportRidesResult {
  period: SupportEligibleRidePeriod;
  setPeriod: (period: SupportEligibleRidePeriod) => void;
  items: EligibleSupportRideDto[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => void;
  retry: () => void;
}

export const useEligibleSupportRides = (
  initialPeriod: SupportEligibleRidePeriod = 'active',
): UseEligibleSupportRidesResult => {
  const [period, setPeriodState] = useState<SupportEligibleRidePeriod>(initialPeriod);
  const [items, setItems] = useState<EligibleSupportRideDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const applyPage = useCallback(
    (pageResult: EligibleSupportRidePageDto, mode: 'replace' | 'append') => {
      setPage(pageResult.page);
      setTotalPages(pageResult.totalPages);
      setItems((prev) =>
        mode === 'append'
          ? mergeEligibleRidesWithoutDuplicates(prev, pageResult.items)
          : pageResult.items,
      );
    },
    [],
  );

  const fetchPage = useCallback(
    async (
      mode: 'initial' | 'refresh' | 'append',
      nextPage: number,
      nextPeriod: SupportEligibleRidePeriod,
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
        const listParams = { period: nextPeriod, page: nextPage, limit: PAGE_SIZE };
        const pageResult = await resourceCache.query<EligibleSupportRidePageDto>({
          key: cacheKeys.support.eligibleRides(listParams),
          staleTime: CACHE_STALE_TIMES.SUPPORT_ELIGIBLE_RIDES,
          force: mode !== 'initial',
          fetcher: () => listEligibleSupportRides(listParams),
        });
        applyPage(pageResult.data, mode === 'append' ? 'append' : 'replace');
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
        if (mode === 'initial') {
          setItems([]);
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

  useEffect(() => {
    void fetchPage('initial', 1, period);
  }, [fetchPage, period]);

  const setPeriod = useCallback((next: SupportEligibleRidePeriod) => {
    setPeriodState(next);
  }, []);

  const refresh = useCallback(async () => {
    resourceCache.invalidate(['support', 'eligible-rides']);
    await fetchPage('refresh', 1, period);
  }, [fetchPage, period]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || page >= totalPages) {
      return;
    }
    void fetchPage('append', page + 1, period);
  }, [fetchPage, loading, refreshing, loadingMore, page, totalPages, period]);

  const retry = useCallback(() => {
    void fetchPage('initial', 1, period);
  }, [fetchPage, period]);

  return {
    period,
    setPeriod,
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: page < totalPages,
    refresh,
    loadMore,
    retry,
  };
};
