import { useEffect, useState } from 'react';

import { env } from '@/config';
import {
  applySheetProfileToSession,
  hydrateDemoData,
  hydrateSessionFromSheet,
} from '@/DemoData';
import { authService } from '@/features/auth/services';
import { pushDebugLog } from '@/features/notifications/push/pushDebug';
import { authSession } from '@/store';
import { useBhaiWayFonts } from '@/shared/theme';

export type AppBootstrapState = {
  ready: boolean;
  fontsLoaded: boolean;
  fontError: Error | null;
};

export const useAppBootstrap = (): AppBootstrapState => {
  const [fontsLoaded, fontError] = useBhaiWayFonts();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void hydrateDemoData();
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    let cancelled = false;

    void (async () => {
      await authSession.hydrate();
      if (authSession.isAuthenticated()) {
        const useSheetProfile = env.useMocks && !env.useMsg91Otp;
        if (useSheetProfile) {
          try {
            await hydrateSessionFromSheet();
            applySheetProfileToSession();
          } catch (error) {
            console.log('[auth] sheet rehydrate skipped', error);
          }
        } else {
          try {
            await authService.hydrateAuthenticatedUser();
          } catch (error) {
            console.log('[auth] GET /users/me rehydrate skipped', error);
          }
        }

        // Push registration is deferred until after splash (PushNotificationsBootstrap
        // mounts with showApp). Requesting permission under the splash overlay caused
        // the Android dialog to be missed and registration to be skipped permanently.
        if (!cancelled && authSession.isAuthenticated()) {
          pushDebugLog('app bootstrap ready — push waits for post-splash bootstrap', {
            reason: 'cold_start_authenticated',
          });
        }
      } else {
        pushDebugLog('app bootstrap ready — no session yet (push waits for login)');
      }
      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, fontError]);

  return { ready, fontsLoaded, fontError };
};
