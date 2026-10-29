import type { Router } from 'expo-router';

import { authSession } from '@/store';

import { activeChatConversationStore } from './activeChatConversationStore';
import { pendingPushNavigation } from './pendingPushNavigation';
import type { ParsedPushNotification } from '../api/pushDevices.types';
import { unreadNotificationEvents } from '../store/unreadNotificationEvents';
import { getPushType, parsePushNotification } from '../utils/parsePushNotification';
import { resolvePushNavigationTarget } from '../utils/resolvePushNavigation';
import {
  ensureBhaiWayNotificationChannel,
  loadNotificationsModule,
} from '../services/notificationPermission';

const PUSH_DEBUG =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_PUSH_DEBUG === '1';

const pushLog = (message: string, extra?: Record<string, unknown>): void => {
  if (!PUSH_DEBUG) {
    return;
  }
  if (extra) {
    console.log(`[Notifications] ${message}`, extra);
    return;
  }
  console.log(`[Notifications] ${message}`);
};

let listenersAttached = false;
let responseSub: { remove: () => void } | null = null;
let receivedSub: { remove: () => void } | null = null;
let handlerConfigured = false;
/** Latest router instance — updated without re-subscribing native listeners. */
let routerRef: Router | null = null;

/**
 * Suppress CHAT_MESSAGE system presentation when that conversation is open.
 */
const shouldSuppressForegroundAlert = (notification: ParsedPushNotification): boolean => {
  const type = getPushType(notification.data);
  if (type !== 'CHAT_MESSAGE') {
    return false;
  }
  return activeChatConversationStore.isActive(notification.data.conversationId);
};

export const configurePushNotificationHandler = (): void => {
  if (handlerConfigured) {
    return;
  }
  const Notifications = loadNotificationsModule();
  if (!Notifications?.setNotificationHandler) {
    return;
  }
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const parsed = parsePushNotification(notification);
      const suppress = shouldSuppressForegroundAlert(parsed);
      return {
        shouldShowBanner: !suppress,
        shouldShowList: !suppress,
        shouldPlaySound: !suppress,
        shouldSetBadge: !suppress,
      };
    },
  });
  pushLog('foreground handler configured');
};

/** Keep navigation target current without tearing down native subscriptions. */
export const setPushNavigationRouter = (router: Router): void => {
  routerRef = router;
};

export const navigateFromPush = (
  router: Router,
  notification: ParsedPushNotification,
): void => {
  const target = resolvePushNavigationTarget(notification.data);
  try {
    if ('params' in target && target.params) {
      router.push({
        pathname: target.pathname as never,
        params: target.params,
      });
      return;
    }
    router.push(target.pathname as never);
  } catch {
    try {
      router.replace('/home' as never);
    } catch {
      // ignore
    }
  }
};

/**
 * Attach one set of received/response listeners for the app lifetime.
 * Pass router via {@link setPushNavigationRouter} — do not re-attach on router identity changes.
 */
export const attachPushNotificationListeners = (): (() => void) => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    pushLog('listeners skipped — notifications module unavailable');
    return () => undefined;
  }
  if (listenersAttached) {
    pushLog('listeners already attached — reuse');
    return () => undefined;
  }

  void ensureBhaiWayNotificationChannel();
  configurePushNotificationHandler();
  listenersAttached = true;
  pushLog('listeners registered');

  receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const parsed = parsePushNotification(notification);
    pushLog('notification received', {
      type: getPushType(parsed.data) || undefined,
      title: parsed.title,
    });
    // Persisted inbox may already include this row — refresh badge/list consumers.
    unreadNotificationEvents.emitRefresh();
  });

  responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const parsed = parsePushNotification(response.notification);
    pushLog('notification response received', {
      type: getPushType(parsed.data) || undefined,
      authenticated: authSession.isAuthenticated(),
    });
    if (!authSession.isAuthenticated()) {
      pendingPushNavigation.set(parsed);
      return;
    }
    pendingPushNavigation.markProcessed(parsed);
    if (routerRef) {
      navigateFromPush(routerRef, parsed);
    } else {
      pendingPushNavigation.set(parsed);
    }
  });

  void (async () => {
    try {
      const last = await Notifications.getLastNotificationResponseAsync?.();
      if (!last) {
        return;
      }
      const parsed = parsePushNotification(last.notification);
      pushLog('cold-start notification response queued');
      pendingPushNavigation.set(parsed);
    } catch {
      // ignore
    }
  })();

  return () => {
    receivedSub?.remove();
    responseSub?.remove();
    receivedSub = null;
    responseSub = null;
    listenersAttached = false;
    pushLog('listeners removed');
  };
};

/** Flush queued cold-start tap after auth + navigation are ready. */
export const flushPendingPushNavigation = (router?: Router): void => {
  const targetRouter = router ?? routerRef;
  if (!targetRouter) {
    return;
  }
  const pending = pendingPushNavigation.consume();
  if (!pending) {
    return;
  }
  pushLog('flushing pending notification navigation');
  navigateFromPush(targetRouter, pending);
};

/** Test-only: reset module flags between isolated runs. */
export const __resetPushListenersForTests = (): void => {
  receivedSub?.remove();
  responseSub?.remove();
  receivedSub = null;
  responseSub = null;
  listenersAttached = false;
  handlerConfigured = false;
  routerRef = null;
};
