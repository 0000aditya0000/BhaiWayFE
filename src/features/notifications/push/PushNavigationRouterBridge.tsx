import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { setPushNavigationRouter } from './pushListeners';

/**
 * Wires expo-router into push tap navigation. Mount inside the app shell
 * (where useRouter is safe). Registration does not depend on this.
 */
export const PushNavigationRouterBridge = (): null => {
  const router = useRouter();

  useEffect(() => {
    setPushNavigationRouter(router);
  }, [router]);

  return null;
};
