import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getCorporateIdentityStatus } from '@/features/profile/api/corporateIdentity.api';
import { isCorporateVerifiedStatus } from '@/features/profile/utils/corporateIdentity.mapper';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';

import { corporateVerificationStore } from '../store';

export interface UseCorporateVerifiedResult {
  verified: boolean;
  ready: boolean;
}

/**
 * Corporate identity is verified when either:
 * - GET /corporate-identity/status returns VERIFIED (backend source of truth)
 * - the local office-commute verification store has a record
 */
export const useCorporateVerified = (): UseCorporateVerifiedResult => {
  const [localVerified, setLocalVerified] = useState(() =>
    corporateVerificationStore.isVerified(),
  );
  const [apiVerified, setApiVerified] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(() =>
    corporateVerificationStore.isVerified(),
  );

  useEffect(
    () =>
      corporateVerificationStore.subscribe((record) => {
        setLocalVerified(record != null);
      }),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (corporateVerificationStore.isVerified()) {
        setLocalVerified(true);
        setStatusLoaded(true);
        return;
      }

      let cancelled = false;
      void resourceCache
        .query({
          key: cacheKeys.corporateIdentity.status(),
          staleTime: CACHE_STALE_TIMES.CORPORATE_IDENTITY,
          force: true,
          fetcher: getCorporateIdentityStatus,
        })
        .then((result) => {
          if (cancelled) {
            return;
          }
          const payload = result.data as
            | { status?: string | null; data?: { status?: string | null } }
            | null
            | undefined;
          const status = String(payload?.status ?? payload?.data?.status ?? '')
            .trim()
            .toUpperCase();
          setApiVerified(isCorporateVerifiedStatus(status === 'VERIFIED' ? 'VERIFIED' : null));
        })
        .catch(() => {
          // Keep last known local/API value.
        })
        .finally(() => {
          if (!cancelled) {
            setStatusLoaded(true);
          }
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const verified = localVerified || apiVerified;
  return {
    verified,
    ready: statusLoaded || verified,
  };
};
