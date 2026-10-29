import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getErrorMessage } from '@/shared/utils';

import { listMyCommuteRewardClaims } from '../api/commuteRewards.api';
import type { CommuteRewardClaimDto } from '../api/commuteRewards.types';
import { COMMUTE_REWARDS_CLAIMS_SCREEN } from '../constants/commute-rewards.constants';

export type CommuteRewardClaimsState = 'loading' | 'ready' | 'empty' | 'error';

export interface UseCommuteRewardClaimsResult {
  claims: CommuteRewardClaimDto[];
  state: CommuteRewardClaimsState;
  errorMessage: string | null;
  refreshing: boolean;
  refresh: () => void;
  retry: () => void;
  goBack: () => void;
}

export const useCommuteRewardClaims = (): UseCommuteRewardClaimsResult => {
  const router = useRouter();
  const [claims, setClaims] = useState<CommuteRewardClaimDto[]>([]);
  const [state, setState] = useState<CommuteRewardClaimsState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!refreshing) {
        setState('loading');
      }
      setErrorMessage(null);
      try {
        const page = await listMyCommuteRewardClaims({ page: 1, limit: 50 });
        if (cancelled) {
          return;
        }
        setClaims(page.items);
        setState(page.items.length === 0 ? 'empty' : 'ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setClaims([]);
        setErrorMessage(
          getErrorMessage(error, COMMUTE_REWARDS_CLAIMS_SCREEN.loadErrorBody),
        );
        setState('error');
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, refreshing]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReloadToken((value) => value + 1);
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: ROUTES.referEarn,
      params: { tab: 'rewards' },
    });
  }, [router]);


  return {
    claims,
    state,
    errorMessage,
    refreshing,
    refresh,
    retry,
    goBack,
  };
};
