import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getWalletBalance, mapWalletApiError } from '../api/wallet.api';
import type { WalletBalanceDto } from '../api/wallet.types';
import { walletStore } from '../store/walletStore';
import { mapWalletBalanceToSummary } from '../utils/mapWalletBalance';
import type { WalletSummary } from '../types';

export interface UseWalletBalanceResult {
  summary: WalletSummary | null;
  loading: boolean;
  error: string | null;
  /** Force network refresh (pull-to-refresh / after mutations). */
  refresh: () => Promise<WalletSummary | null>;
  /** Soft ensure — cache hit when fresh; SWR when stale. */
  ensure: () => Promise<WalletSummary | null>;
}

const applyBalance = (balance: WalletBalanceDto): WalletSummary => {
  walletStore.setBalance(balance);
  resourceCache.setData(cacheKeys.wallet.balance(), balance);
  return mapWalletBalanceToSummary(balance);
};

/**
 * Centralized wallet balance hook — reusable by Wallet screen, Profile, Assured Ride, etc.
 * Backend is the financial authority; this hook only fetches and caches display state.
 */
export const useWalletBalance = (): UseWalletBalanceResult => {
  const storeSnapshot = useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getSnapshot,
    walletStore.getSnapshot,
  );

  const ensure = useCallback(async (): Promise<WalletSummary | null> => {
    try {
      const result = await resourceCache.query<WalletBalanceDto>({
        key: cacheKeys.wallet.balance(),
        staleTime: CACHE_STALE_TIMES.WALLET,
        fetcher: getWalletBalance,
      });
      return applyBalance(result.data);
    } catch (error) {
      const kept = walletStore.getSnapshot().balance ?? resourceCache.peek<WalletBalanceDto>(
        cacheKeys.wallet.balance(),
      );
      if (kept) {
        return mapWalletBalanceToSummary(kept);
      }
      walletStore.setError(mapWalletApiError(error));
      return null;
    }
  }, []);

  const refresh = useCallback(async (): Promise<WalletSummary | null> => {
    walletStore.setLoading(true);
    try {
      const result = await resourceCache.query<WalletBalanceDto>({
        key: cacheKeys.wallet.balance(),
        staleTime: CACHE_STALE_TIMES.WALLET,
        force: true,
        fetcher: getWalletBalance,
      });
      return applyBalance(result.data);
    } catch (error) {
      const kept = walletStore.getSnapshot().balance ?? resourceCache.peek<WalletBalanceDto>(
        cacheKeys.wallet.balance(),
      );
      if (kept) {
        walletStore.setBalance(kept);
        return mapWalletBalanceToSummary(kept);
      }
      walletStore.setError(mapWalletApiError(error));
      return null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void ensure();
    }, [ensure]),
  );

  useEffect(() => {
    if (!storeSnapshot.balance && !storeSnapshot.loading && !storeSnapshot.error) {
      void ensure();
    }
  }, [ensure, storeSnapshot.balance, storeSnapshot.error, storeSnapshot.loading]);

  const summary = useMemo(
    () => (storeSnapshot.balance ? mapWalletBalanceToSummary(storeSnapshot.balance) : null),
    [storeSnapshot.balance],
  );

  return {
    summary,
    loading: storeSnapshot.loading && !storeSnapshot.balance,
    error: storeSnapshot.error,
    refresh,
    ensure,
  };
};
