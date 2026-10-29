import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import { driverLocationPublisher } from '@/services/location';
import { shouldReconcileOnAppState } from '@/services/location/driverLocationPublisher.logic';
import { authSession } from '@/store';

/**
 * Owns driver live-location lifecycle at the app shell.
 * Pickup / Active Trip screens subscribe; they must not start or stop GPS on unmount.
 */
export const DriverLocationTrackingBootstrap = (): null => {
  useEffect(() => {
    let lastToken: string | null = null;
    const unsubAuth = authSession.subscribe((session) => {
      if (!session.token || !session.user) {
        lastToken = null;
        void driverLocationPublisher.stop('logout');
        return;
      }
      if (lastToken === session.token) {
        return;
      }
      lastToken = session.token;
      void driverLocationPublisher.reconcile();
    });

    const unsubRides = driverRidesRefreshStore.subscribe(() => {
      if (authSession.isAuthenticated()) {
        void driverLocationPublisher.reconcile();
      }
    });

    const appSub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (!shouldReconcileOnAppState(next) || !authSession.isAuthenticated()) {
        return;
      }
      void driverLocationPublisher.reconcile();
    });

    return () => {
      unsubAuth();
      unsubRides();
      appSub.remove();
    };
  }, []);

  return null;
};
