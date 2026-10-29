import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

import { ROUTES } from '@/config';
import { authSession } from '@/store';
import { triggerLightHaptic } from '@/shared/utils';
import { getMyVerifications } from '../api/verification.api';
import {
  getWalletBalance,
  listWalletTransactions,
} from '../api/wallet.api';
import {
  AADHAAR_REWARD_CLAIM_SHOW_DELAY_MS,
  AADHAAR_REWARD_POLL_ATTEMPTS,
  AADHAAR_REWARD_POLL_INTERVAL_MS,
} from '../constants/aadhaar-reward.constants';
import { aadhaarRewardUiStore } from '../store/aadhaarRewardUiStore';
import { verificationStore } from '../store/verificationStore';
import { walletStore } from '../store/walletStore';
import {
  decideAadhaarRewardUiMode,
  findAadhaarRewardTransaction,
  shouldShowAadhaarRewardClaimOnRoute,
  type AadhaarRewardUiFlags,
  type AadhaarRewardUiMode,
} from '../utils/aadhaarReward.utils';

export interface UseAadhaarRewardResult {
  mode: AadhaarRewardUiMode;
  claimVisible: boolean;
  celebrationVisible: boolean;
  onClaim: () => void;
  onDismissClaim: () => void;
  onCelebrationContinue: () => void;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const refreshWalletFromBackend = async (): Promise<boolean> => {
  try {
    const { invalidateAfterAadhaarVerification, cacheKeys, resourceCache } = await import(
      '@/network/resourceCache'
    );
    invalidateAfterAadhaarVerification();
    const [balance, page] = await Promise.all([
      getWalletBalance(),
      listWalletTransactions({ page: 1, limit: 30 }),
    ]);
    walletStore.setBalance(balance);
    resourceCache.setData(cacheKeys.wallet.balance(), balance);
    walletStore.bumpTransactionsRefresh();
    return Boolean(findAadhaarRewardTransaction(page.items));
  } catch {
    return false;
  }
};

const refreshIdentityVerified = async (): Promise<boolean> => {
  if (verificationStore.isIdentityVerified()) {
    return true;
  }
  try {
    const verifications = await getMyVerifications();
    verificationStore.set(verifications);
    return verifications.identity.status === 'VERIFIED';
  } catch {
    return verificationStore.isIdentityVerified();
  }
};

export const useAadhaarReward = (): UseAadhaarRewardResult => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [flags, setFlags] = useState<AadhaarRewardUiFlags>(() =>
    aadhaarRewardUiStore.getFlags(),
  );
  const [userId, setUserId] = useState<string | null>(() => authSession.getUser()?.id ?? null);
  const [profileCompleted, setProfileCompleted] = useState(() =>
    authSession.getProfileCompleted(),
  );
  const [identityVerified, setIdentityVerified] = useState(() =>
    verificationStore.isIdentityVerified(),
  );
  const [rewardConfirmed, setRewardConfirmed] = useState(false);
  const [claimReady, setClaimReady] = useState(false);
  const pollingRef = useRef(false);
  const evaluatedSessionRef = useRef<string | null>(null);

  const mode = decideAadhaarRewardUiMode({
    flags,
    identityVerified,
    rewardConfirmed,
  });
  // Claim + celebration only after registration, on Home — not over Setup Profile
  // (referral signup was falsely triggering celebration via a 50-coin wallet credit).
  const modalAllowedOnRoute = shouldShowAadhaarRewardClaimOnRoute({
    mode,
    profileCompleted,
    pathname,
    segments,
  });
  const effectiveMode: AadhaarRewardUiMode =
    (mode === 'claim' || mode === 'celebration') && !modalAllowedOnRoute
      ? 'none'
      : mode;

  const syncSession = useCallback(async () => {
    const sessionUser = authSession.getUser();
    const nextId = sessionUser?.id ?? null;
    setUserId(nextId);
    setProfileCompleted(authSession.getProfileCompleted());
    if (!nextId || !authSession.isAuthenticated()) {
      setFlags(aadhaarRewardUiStore.getFlags());
      setRewardConfirmed(false);
      setClaimReady(false);
      evaluatedSessionRef.current = null;
      await aadhaarRewardUiStore.hydrateForUser(null);
      return;
    }
    const loaded = await aadhaarRewardUiStore.hydrateForUser(nextId);
    setFlags(loaded);
  }, []);

  const evaluateRewardState = useCallback(
    async (options?: { poll?: boolean }) => {
      if (!authSession.isAuthenticated() || !userId) {
        return;
      }

      const verified = await refreshIdentityVerified();
      setIdentityVerified(verified);

      if (!verified && !options?.poll) {
        const confirmed = await refreshWalletFromBackend();
        setRewardConfirmed(confirmed);
        return;
      }

      if (!verified) {
        setRewardConfirmed(false);
        return;
      }

      if (flags.celebrationSeen) {
        setRewardConfirmed(true);
        return;
      }

      if (pollingRef.current) {
        return;
      }

      pollingRef.current = true;
      try {
        let confirmed = await refreshWalletFromBackend();
        if (!confirmed && options?.poll) {
          for (let attempt = 1; attempt < AADHAAR_REWARD_POLL_ATTEMPTS; attempt += 1) {
            await wait(AADHAAR_REWARD_POLL_INTERVAL_MS);
            confirmed = await refreshWalletFromBackend();
            if (confirmed) {
              break;
            }
          }
        }
        setRewardConfirmed(confirmed);
      } finally {
        pollingRef.current = false;
      }
    },
    [flags.celebrationSeen, userId],
  );

  useEffect(() => {
    void syncSession();
    return authSession.subscribe(() => {
      void syncSession();
    });
  }, [syncSession]);

  useEffect(() => aadhaarRewardUiStore.subscribe((_id, nextFlags) => {
    setFlags(nextFlags);
  }), []);

  useEffect(() => {
    let wasVerified = verificationStore.isIdentityVerified();
    return verificationStore.subscribe((state) => {
      const verified = state?.identity.status === 'VERIFIED';
      setIdentityVerified(verified);
      // Transition into VERIFIED → bounded reward poll (backend credits; UI only waits).
      if (verified && !wasVerified && !aadhaarRewardUiStore.getFlags().celebrationSeen) {
        aadhaarRewardUiStore.signalAadhaarVerified();
      }
      wasVerified = verified;
    });
  }, []);

  useEffect(() => {
    if (!userId || !authSession.isAuthenticated()) {
      return;
    }
    if (evaluatedSessionRef.current === userId) {
      return;
    }
    evaluatedSessionRef.current = userId;
    void evaluateRewardState({ poll: false });
  }, [evaluateRewardState, userId]);

  useEffect(() => {
    if (!aadhaarRewardUiStore.hasPendingVerifiedCheck()) {
      return;
    }
    aadhaarRewardUiStore.consumePendingVerifiedCheck();
    void evaluateRewardState({ poll: true });
  }, [evaluateRewardState, flags, identityVerified]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active' && authSession.isAuthenticated()) {
        void evaluateRewardState({
          poll: aadhaarRewardUiStore.hasPendingVerifiedCheck(),
        });
        if (aadhaarRewardUiStore.hasPendingVerifiedCheck()) {
          aadhaarRewardUiStore.consumePendingVerifiedCheck();
        }
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [evaluateRewardState]);

  useEffect(() => {
    if (effectiveMode !== 'claim') {
      setClaimReady(false);
      return;
    }
    const timer = setTimeout(() => setClaimReady(true), AADHAAR_REWARD_CLAIM_SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [effectiveMode]);

  const onDismissClaim = useCallback(() => {
    triggerLightHaptic();
    if (!userId) {
      return;
    }
    void aadhaarRewardUiStore.dismissClaimModal(userId);
  }, [userId]);

  const onClaim = useCallback(() => {
    triggerLightHaptic();
    if (userId) {
      void aadhaarRewardUiStore.dismissClaimModal(userId);
    }
    const inAuthStack = pathname.includes('/login');
    router.push(inAuthStack ? ROUTES.authVerifyAadhaar : ROUTES.verifyAadhaar);
  }, [pathname, router, userId]);

  const onCelebrationContinue = useCallback(() => {
    triggerLightHaptic();
    if (userId) {
      void aadhaarRewardUiStore.markCelebrationSeen(userId);
    }
    router.replace(ROUTES.home);
  }, [router, userId]);

  return {
    mode: effectiveMode,
    claimVisible: effectiveMode === 'claim' && claimReady,
    celebrationVisible: effectiveMode === 'celebration',
    onClaim,
    onDismissClaim,
    onCelebrationContinue,
  };
};
