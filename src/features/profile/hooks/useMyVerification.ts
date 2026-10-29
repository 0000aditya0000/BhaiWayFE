import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { authSession } from '@/store';
import { getErrorMessage } from '@/shared/utils';
import { getMyVerifications, type MyVerificationsResponse } from '../api';
import { verificationStore } from '../store/verificationStore';

export interface UseMyVerificationResult {
  verifications: MyVerificationsResponse | null;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Loads GET /verification/me for the logged-in user (Bearer JWT).
 * Shared resource cache — focus does not force a network call when fresh.
 */
export const useMyVerification = (): UseMyVerificationResult => {
  const [verifications, setVerifications] = useState<MyVerificationsResponse | null>(
    () => resourceCache.peek<MyVerificationsResponse>(cacheKeys.verification.me()) ?? null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensure = useCallback(async () => {
    if (!authSession.getToken()) {
      setVerifications(null);
      setError(null);
      return;
    }

    try {
      const result = await resourceCache.query({
        key: cacheKeys.verification.me(),
        staleTime: CACHE_STALE_TIMES.VERIFICATION,
        fetcher: getMyVerifications,
      });
      verificationStore.set(result.data);
      setVerifications(result.data);
      setError(null);
    } catch (err) {
      const kept = resourceCache.peek<MyVerificationsResponse>(cacheKeys.verification.me());
      if (kept) {
        setVerifications(kept);
        setError(null);
        return;
      }
      const message = getErrorMessage(err);
      console.log('[Verification] GET /verification/me failed', message);
      setError(message);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!authSession.getToken()) {
      setVerifications(null);
      setError(null);
      return;
    }

    setRefreshing(true);
    try {
      const result = await resourceCache.query({
        key: cacheKeys.verification.me(),
        staleTime: CACHE_STALE_TIMES.VERIFICATION,
        force: true,
        fetcher: getMyVerifications,
      });
      verificationStore.set(result.data);
      setVerifications(result.data);
      setError(null);
    } catch (err) {
      const kept = resourceCache.peek<MyVerificationsResponse>(cacheKeys.verification.me());
      if (kept) {
        setVerifications(kept);
        return;
      }
      const message = getErrorMessage(err);
      console.log('[Verification] GET /verification/me failed', message);
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void ensure();
    }, [ensure]),
  );

  return {
    verifications,
    refreshing,
    error,
    refresh,
  };
};
