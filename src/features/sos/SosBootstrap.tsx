import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { authSession } from '@/store';

import { sosSession } from './services/sosSession';

export const SosBootstrap = (): null => {
  useEffect(() => {
    let lastToken: string | null = null;

    const startIfAuthenticated = (): void => {
      if (!authSession.isAuthenticated()) {
        lastToken = null;
        void sosSession.stop();
        return;
      }
      const token = authSession.getToken();
      if (lastToken === token) {
        sosSession.recover();
        return;
      }
      lastToken = token;
      sosSession.start();
    };

    startIfAuthenticated();
    const unsubAuth = authSession.subscribe(() => {
      startIfAuthenticated();
    });

    const appSub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && authSession.isAuthenticated()) {
        sosSession.recover();
      }
    });

    return () => {
      unsubAuth();
      appSub.remove();
    };
  }, []);

  return null;
};
