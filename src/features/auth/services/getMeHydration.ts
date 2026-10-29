import type { GetMeResponse } from '../types';
import { assuredDepositPenaltyStore } from '@/features/profile/store/assuredDepositPenaltyStore';
import { userMeSummaryStore } from '@/features/profile/store/userMeSummaryStore';
import { walletStore } from '@/features/profile/store/walletStore';
import { cacheKeys, resourceCache } from '@/network/resourceCache';

export const applyGetMeHydration = (response: GetMeResponse): void => {
  const userId = response.user?.id?.trim() || null;
  if (userId) {
    resourceCache.setUserScope(userId);
  }

  resourceCache.setData(cacheKeys.user.me(), response);

  assuredDepositPenaltyStore.set(response.assuredDepositPenalty ?? null);

  if (response.wallet) {
    walletStore.setBalance(response.wallet);
    resourceCache.setData(cacheKeys.wallet.balance(), response.wallet);
  }

  userMeSummaryStore.apply({
    driverEarnings: response.driverEarnings ?? null,
    ratings: response.ratings ?? null,
  });
};

export const clearGetMeHydration = (): void => {
  assuredDepositPenaltyStore.clear();
  walletStore.clear();
  userMeSummaryStore.clear();
  resourceCache.clearAll();
};
