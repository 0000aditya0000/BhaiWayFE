import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getErrorMessage } from '@/shared/utils';

import { listActiveCommuteRewardCampaigns } from '../api/commuteRewards.api';
import type { CommuteRewardCampaignDto } from '../api/commuteRewards.types';

export type CommuteRewardsListState = 'loading' | 'ready' | 'empty' | 'error';

export interface UseCommuteRewardsListResult {
  campaigns: CommuteRewardCampaignDto[];
  state: CommuteRewardsListState;
  errorMessage: string | null;
  refreshing: boolean;
  refresh: () => void;
  retry: () => void;
  openCampaign: (campaignId: string) => void;
  openClaims: () => void;
  goBack: () => void;
}

export const useCommuteRewardsList = (): UseCommuteRewardsListResult => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CommuteRewardCampaignDto[]>([]);
  const [state, setState] = useState<CommuteRewardsListState>('loading');
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
        const items = await listActiveCommuteRewardCampaigns();
        if (cancelled) {
          return;
        }
        setCampaigns(items);
        setState(items.length === 0 ? 'empty' : 'ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setCampaigns([]);
        setErrorMessage(getErrorMessage(error, 'Could not load reward campaigns.'));
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

  const openCampaign = useCallback(
    (campaignId: string) => {
      router.push({
        pathname: ROUTES.rewardDetail,
        params: { campaignId },
      });
    },
    [router],
  );

  const openClaims = useCallback(() => {
    router.push(ROUTES.rewardClaims);
  }, [router]);

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
    campaigns,
    state,
    errorMessage,
    refreshing,
    refresh,
    retry,
    openCampaign,
    openClaims,
    goBack,
  };
};
