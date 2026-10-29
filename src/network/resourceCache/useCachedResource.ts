import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { CacheKey } from './cacheKeys';
import { resourceCache } from './resourceCache';

export type UseCachedResourceOptions<T> = {
  key: CacheKey;
  fetcher: () => Promise<T>;
  staleTime: number;
  /** When false, skip automatic ensure (still exposes refresh). */
  enabled?: boolean;
  /**
   * When true (default), focus runs soft ensure (cache hit / SWR).
   * Set false when the parent controls loading (e.g. combined loaders).
   */
  refreshOnFocus?: boolean;
};

export type UseCachedResourceResult<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** Soft ensure — uses cache when fresh; SWR when stale. */
  ensure: () => Promise<T | null>;
  /** Force network refresh (pull-to-refresh). */
  refresh: () => Promise<T | null>;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'Unable to load data. Please try again.';
};

/**
 * Shared resource reader with stale-while-revalidate + focus soft-ensure.
 * Preserves cached data when a background/force refresh fails.
 */
export const useCachedResource = <T>(
  options: UseCachedResourceOptions<T>,
): UseCachedResourceResult<T> => {
  const { key, fetcher, staleTime, enabled = true, refreshOnFocus = true } = options;
  const keyRef = useRef(key);
  keyRef.current = key;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(() => resourceCache.peek<T>(key) ?? null);
  const [loading, setLoading] = useState(() => enabled && resourceCache.peek<T>(key) == null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return resourceCache.subscribe(key, () => {
      const next = resourceCache.peek<T>(keyRef.current);
      if (next !== undefined) {
        setData(next);
      }
    });
  }, [key]);

  const ensure = useCallback(async (): Promise<T | null> => {
    if (!enabled) {
      return resourceCache.peek<T>(keyRef.current) ?? null;
    }
    const cached = resourceCache.peek<T>(keyRef.current);
    if (cached === undefined) {
      setLoading(true);
    }
    try {
      const result = await resourceCache.query({
        key: keyRef.current,
        fetcher: () => fetcherRef.current(),
        staleTime,
      });
      setData(result.data);
      setError(null);
      return result.data;
    } catch (err) {
      const kept = resourceCache.peek<T>(keyRef.current);
      if (kept !== undefined) {
        setData(kept);
        setError(null);
        return kept;
      }
      setError(toErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, staleTime]);

  const refresh = useCallback(async (): Promise<T | null> => {
    if (!enabled) {
      return null;
    }
    setRefreshing(true);
    try {
      const result = await resourceCache.query({
        key: keyRef.current,
        fetcher: () => fetcherRef.current(),
        staleTime,
        force: true,
      });
      setData(result.data);
      setError(null);
      return result.data;
    } catch (err) {
      const kept = resourceCache.peek<T>(keyRef.current);
      if (kept !== undefined) {
        setData(kept);
        return kept;
      }
      setError(toErrorMessage(err));
      return null;
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [enabled, staleTime]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !refreshOnFocus) {
        return;
      }
      void ensure();
    }, [enabled, ensure, refreshOnFocus]),
  );

  useEffect(() => {
    if (!enabled || refreshOnFocus) {
      return;
    }
    void ensure();
  }, [enabled, ensure, refreshOnFocus]);

  return {
    data,
    loading,
    refreshing,
    error,
    ensure,
    refresh,
  };
};
