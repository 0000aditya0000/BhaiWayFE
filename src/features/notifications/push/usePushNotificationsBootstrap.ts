import { useEffect, useRef } from 'react';
import { AppState, InteractionManager, type AppStateStatus } from 'react-native';

import { authSession } from '@/store';

import {
  getPushEnvironmentSnapshot,
  wasOsNotificationDialogShownThisSession,
} from '../services/notificationPermission';
import { pushDebugLog } from './pushDebug';
import {
  attachPushNotificationListeners,
  configurePushNotificationHandler,
  flushPendingPushNavigation,
} from './pushListeners';
import {
  registerCurrentPushDeviceDetailed,
  startPushTokenRefreshListener,
} from './pushRegistration';

/** Brief delay so the system dialog is not shown under a fading splash / transition. */
const PERMISSION_DIALOG_READY_MS = 450;

/**
 * Push registration + listeners.
 *
 * Must mount only after the animated splash is gone (see app/_layout.tsx).
 * Requesting POST_NOTIFICATIONS under the opaque splash caused the dialog to be
 * missed; promptedRef then blocked later prompts → no FCM registration.
 *
 * promptedRef is set only after an OS permission dialog actually ran (or permission
 * is already granted) — never for skipped/auth-not-ready attempts.
 */
export const usePushNotificationsBootstrap = (): void => {
  const flushedRef = useRef(false);
  const promptedRef = useRef(false);
  const effectRanRef = useRef(false);

  useEffect(() => {
    pushDebugLog('stage: bootstrap effect running', {
      alreadyRan: effectRanRef.current,
      authenticated: authSession.isAuthenticated(),
      hydrated: authSession.isHydrated(),
      ...getPushEnvironmentSnapshot(),
    });
    effectRanRef.current = true;

    configurePushNotificationHandler();
    const detachListeners = attachPushNotificationListeners();
    const stopRefresh = startPushTokenRefreshListener();

    let cancelled = false;
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        pendingTimers.delete(id);
        if (!cancelled) {
          fn();
        }
      }, ms);
      pendingTimers.add(id);
    };

    const tryRegister = (reason: string, requestPermissionIfNeeded: boolean, deferMs = 0) => {
      if (!authSession.isAuthenticated()) {
        pushDebugLog('stage: skipped — authentication session not ready', { reason });
        return;
      }
      if (!authSession.getToken()) {
        pushDebugLog('stage: skipped — session without JWT', { reason });
        return;
      }

      const wantPrompt =
        requestPermissionIfNeeded &&
        !promptedRef.current &&
        !wasOsNotificationDialogShownThisSession();
      pushDebugLog('stage: authentication session ready', {
        reason,
        requestPermissionIfNeeded: wantPrompt,
        promptedAlready: promptedRef.current,
        osDialogAlreadyShown: wasOsNotificationDialogShownThisSession(),
        deferMs,
        ...getPushEnvironmentSnapshot(),
      });

      const run = () => {
        if (cancelled) {
          return;
        }
        void (async () => {
          const result = await registerCurrentPushDeviceDetailed({
            requestPermissionIfNeeded: wantPrompt,
            offerDenialGuidance: wantPrompt,
          });
          // Only suppress future auto-prompts after a real OS ask or grant.
          if (
            result.didRequestPermission ||
            result.permissionGranted ||
            wasOsNotificationDialogShownThisSession()
          ) {
            promptedRef.current = true;
          }
        })();
      };

      if (deferMs > 0) {
        InteractionManager.runAfterInteractions(() => {
          schedule(run, deferMs);
        });
        return;
      }
      run();
    };

    // First attempt after splash — defer so the activity can present the dialog.
    tryRegister('post_splash_mount', true, PERMISSION_DIALOG_READY_MS);

    const unsubAuth = authSession.subscribe((state) => {
      pushDebugLog('auth subscribe notify', {
        hasToken: Boolean(state.token),
        hasUser: Boolean(state.user),
        hydrated: state.hydrated,
      });
      if (state.token && state.user) {
        tryRegister('auth_subscribe', !promptedRef.current, PERMISSION_DIALOG_READY_MS);
        if (!flushedRef.current) {
          flushedRef.current = true;
          requestAnimationFrame(() => {
            flushPendingPushNavigation();
          });
        }
      } else {
        // Logout — allow a fresh permission prompt on the next login.
        promptedRef.current = false;
        pushDebugLog('skipped: auth subscribe without full session', {
          hasToken: Boolean(state.token),
          hasUser: Boolean(state.user),
        });
      }
    });

    if (authSession.isAuthenticated() && authSession.getToken()) {
      tryRegister('post_subscribe_sync', !promptedRef.current, PERMISSION_DIALOG_READY_MS);
      if (!flushedRef.current) {
        flushedRef.current = true;
        requestAnimationFrame(() => {
          flushPendingPushNavigation();
        });
      }
    }

    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active') {
        return;
      }
      if (!authSession.isAuthenticated()) {
        pushDebugLog('skipped: app active but no authenticated user');
        return;
      }
      // Resume: refresh token registration. May prompt only if we never successfully
      // asked and permission is still requestable (promptedRef false).
      pushDebugLog('app became active — refresh registration', {
        mayPrompt: !promptedRef.current,
      });
      void registerCurrentPushDeviceDetailed({
        requestPermissionIfNeeded:
          !promptedRef.current && !wasOsNotificationDialogShownThisSession(),
        offerDenialGuidance: false,
      }).then((result) => {
        if (
          result.didRequestPermission ||
          result.permissionGranted ||
          wasOsNotificationDialogShownThisSession()
        ) {
          promptedRef.current = true;
        }
      });
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      pendingTimers.forEach((id) => clearTimeout(id));
      pendingTimers.clear();
      pushDebugLog('bootstrap effect cleanup');
      detachListeners();
      stopRefresh();
      unsubAuth();
      appSub.remove();
    };
  }, []);
};
