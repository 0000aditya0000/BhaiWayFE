import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getErrorMessage, showAppAlert } from '@/shared/utils';

import {
  claimCommuteRewardMilestone,
  getCommuteRewardCampaignWithProgress,
} from '../api/commuteRewards.api';
import type { CommuteRewardCampaignDto } from '../api/commuteRewards.types';
import { COMMUTE_REWARDS_DETAIL_SCREEN } from '../constants/commute-rewards.constants';
import { canClaimMilestone } from '../utils/commuteRewards.mapper';

export type CommuteRewardDetailState = 'loading' | 'ready' | 'error';

export interface UseCommuteRewardCampaignResult {
  campaign: CommuteRewardCampaignDto | null;
  state: CommuteRewardDetailState;
  errorMessage: string | null;
  claimingMilestoneId: string | null;
  refresh: () => void;
  retry: () => void;
  claimMilestone: (milestoneId: string) => void;
  goBack: () => void;
  openClaims: () => void;
}

export const useCommuteRewardCampaign = (
  campaignId: string,
): UseCommuteRewardCampaignResult => {
  const router = useRouter();
  const [campaign, setCampaign] = useState<CommuteRewardCampaignDto | null>(null);
  const [state, setState] = useState<CommuteRewardDetailState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimingMilestoneId, setClaimingMilestoneId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const claimInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const id = campaignId.trim();

    const load = async () => {
      if (!id) {
        setState('error');
        setErrorMessage('Missing campaign.');
        setCampaign(null);
        return;
      }
      setState('loading');
      setErrorMessage(null);
      try {
        const next = await getCommuteRewardCampaignWithProgress(id);
        if (cancelled) {
          return;
        }
        if (!next) {
          setCampaign(null);
          setErrorMessage('Campaign not found.');
          setState('error');
          return;
        }
        setCampaign(next);
        setState('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setCampaign(null);
        setErrorMessage(getErrorMessage(error, COMMUTE_REWARDS_DETAIL_SCREEN.loadErrorBody));
        setState('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, reloadToken]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const refresh = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const claimMilestone = useCallback(
    (milestoneId: string) => {
      if (claimInFlightRef.current || claimingMilestoneId) {
        return;
      }
      const id = campaignId.trim();
      const milestone = campaign?.milestones.find((item) => item.id === milestoneId);
      if (!id || !milestone || !canClaimMilestone(milestone)) {
        return;
      }

      claimInFlightRef.current = true;
      setClaimingMilestoneId(milestoneId);

      void (async () => {
        try {
          const claim = await claimCommuteRewardMilestone(id, milestoneId);
          showAppAlert(
            COMMUTE_REWARDS_DETAIL_SCREEN.claimSuccessTitle,
            claim?.status
              ? `${COMMUTE_REWARDS_DETAIL_SCREEN.claimSuccessBody} Status: ${claim.status}.`
              : COMMUTE_REWARDS_DETAIL_SCREEN.claimSuccessBody,
          );
          setReloadToken((value) => value + 1);
        } catch (error) {
          showAppAlert(
            COMMUTE_REWARDS_DETAIL_SCREEN.claimErrorTitle,
            getErrorMessage(error, 'Claim could not be submitted.'),
          );
        } finally {
          claimInFlightRef.current = false;
          setClaimingMilestoneId(null);
        }
      })();
    },
    [campaign?.milestones, campaignId, claimingMilestoneId],
  );

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

  const openClaims = useCallback(() => {
    router.push(ROUTES.rewardClaims);
  }, [router]);

  return {
    campaign,
    state,
    errorMessage,
    claimingMilestoneId,
    refresh,
    retry,
    claimMilestone,
    goBack,
    openClaims,
  };
};
