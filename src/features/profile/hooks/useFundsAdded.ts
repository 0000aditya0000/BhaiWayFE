import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useSessionUser } from '@/shared/hooks';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { DEFAULT_PROFILE_AVATAR } from '../constants/profile.constants';
import { FUNDS_ADDED_SCREEN } from '../constants/funds-added.constants';
import { walletTopUpReturnStore } from '../store/walletTopUpReturnStore';
import { formatCoinString } from '../utils/walletCoin';
import { useWalletBalance } from './useWalletBalance';

export interface UseFundsAddedResult {
  brandTitle: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  balanceLabel: string;
  statusLabel: string;
  statusTitle: string;
  updatedLabel: string;
  goToWalletLabel: string;
  bookRideLabel: string;
  receiptLabel: string;
  avatarUri: string;
  /** True when top-up was started from a booking / payment screen. */
  returnToBooking: boolean;
  goToWallet: () => void;
  bookRide: () => void;
  viewReceipt: () => void;
  openNotifications: () => void;
  openProfile: () => void;
}

export const useFundsAdded = (): UseFundsAddedResult => {
  const router = useRouter();
  const user = useSessionUser();
  const { summary } = useWalletBalance();
  const params = useLocalSearchParams<{
    amountLabel?: string;
    balanceLabel?: string;
    amountCoins?: string;
  }>();

  const returnTarget = useSyncExternalStore(
    walletTopUpReturnStore.subscribe,
    walletTopUpReturnStore.get,
    walletTopUpReturnStore.get,
  );

  const avatarUri = useMemo(
    () => user?.avatarUri ?? DEFAULT_PROFILE_AVATAR,
    [user?.avatarUri],
  );

  const amountLabel = useMemo(() => {
    const fromParam = getSearchParam(params.amountLabel);
    if (fromParam) {
      return fromParam;
    }
    const coins = getSearchParam(params.amountCoins);
    if (coins) {
      return formatCoinString(coins);
    }
    return FUNDS_ADDED_SCREEN.defaultAmountLabel;
  }, [params.amountCoins, params.amountLabel]);

  const balanceLabel = useMemo(() => {
    const fromParam = getSearchParam(params.balanceLabel);
    if (fromParam) {
      return fromParam;
    }
    if (summary) {
      return formatCoinString(summary.balanceCoins);
    }
    return FUNDS_ADDED_SCREEN.defaultBalanceLabel;
  }, [params.balanceLabel, summary]);

  const returnToBooking = Boolean(returnTarget?.pathname);

  const goToWallet = useCallback(() => {
    triggerLightHaptic();
    const pending = walletTopUpReturnStore.consume();
    if (pending?.pathname) {
      router.replace({
        pathname: pending.pathname as '/',
        params: pending.params,
      });
      return;
    }
    router.replace(ROUTES.wallet);
  }, [router]);

  const bookRide = useCallback(() => {
    triggerLightHaptic();
    walletTopUpReturnStore.clear();
    router.replace(ROUTES.rideSearch);
  }, [router]);

  const viewReceipt = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.walletTransactions);
  }, [router]);

  const openNotifications = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.notifications);
  }, [router]);

  const openProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(ROUTES.profile);
  }, [router]);

  return {
    brandTitle: FUNDS_ADDED_SCREEN.brandTitle,
    title: FUNDS_ADDED_SCREEN.title,
    subtitle: FUNDS_ADDED_SCREEN.subtitle,
    amountLabel,
    balanceLabel,
    statusLabel: FUNDS_ADDED_SCREEN.statusLabel,
    statusTitle: FUNDS_ADDED_SCREEN.statusTitle,
    updatedLabel: FUNDS_ADDED_SCREEN.updatedLabel,
    goToWalletLabel: returnToBooking
      ? FUNDS_ADDED_SCREEN.continueBookingLabel
      : FUNDS_ADDED_SCREEN.goToWalletLabel,
    bookRideLabel: FUNDS_ADDED_SCREEN.bookRideLabel,
    receiptLabel: FUNDS_ADDED_SCREEN.receiptLabel,
    avatarUri,
    returnToBooking,
    goToWallet,
    bookRide,
    viewReceipt,
    openNotifications,
    openProfile,
  };
};
