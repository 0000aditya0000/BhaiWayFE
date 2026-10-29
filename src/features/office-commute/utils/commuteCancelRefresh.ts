import { hydrateAuthenticatedUserFromServer } from '@/features/auth/services/sessionHydration';
import { getWalletBalance } from '@/features/profile/api/wallet.api';
import { walletStore } from '@/features/profile/store/walletStore';
import { listMyBookings } from '@/features/ride-search/api';

/** Refresh passenger wallet + bookings after a Commute cancellation/refund. */
export const refreshAfterCommutePassengerCancel = async (): Promise<void> => {
  await Promise.all([
    listMyBookings().catch((error) => {
      console.log('[Commute Cancel] GET /bookings/my refresh failed', error);
    }),
    getWalletBalance()
      .then((balance) => {
        walletStore.setBalance(balance);
        walletStore.bumpTransactionsRefresh();
      })
      .catch((error) => {
        console.log('[Commute Cancel] GET /wallet refresh failed', error);
      }),
    hydrateAuthenticatedUserFromServer().catch((error) => {
      console.log('[Commute Cancel] GET /users/me refresh failed', error);
    }),
  ]);
};
