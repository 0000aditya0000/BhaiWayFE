import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { authSession } from '@/store';

import { registerPushDevice, unregisterPushDevice } from '../api/pushDevices.api';
import type { PushDevicePlatform } from '../api/pushDevices.types';
import {
  ensureBhaiWayNotificationChannel,
  getNotificationPermissionDetails,
  getPushEnvironmentSnapshot,
  isNotificationsExpoGoEnvironment,
  loadNotificationsModule,
  requestNotificationPermission,
  shouldRequestNotificationPermission,
} from '../services/notificationPermission';
import { maybeOfferNotificationPermissionHelp } from './notificationPermissionGuidance';
import { pushDebugError, pushDebugLog } from './pushDebug';
import { pushTokenStorage } from './pushTokenStorage';

const resolveEasProjectId = (): string | null => {
  const fromEas = Constants.easConfig?.projectId?.trim();
  if (fromEas) {
    return fromEas;
  }
  const fromExtra = (
    Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  )?.eas?.projectId?.trim();
  return fromExtra || null;
};

const EXPECTED_EAS_PROJECT_ID = '0b5df897-5c40-4adf-b956-550fd7c65877';

const maskToken = (token: string): string => {
  const trimmed = token.trim();
  if (trimmed.length <= 16) {
    return `${trimmed.slice(0, 4)}…`;
  }
  return `${trimmed.slice(0, 8)}…${trimmed.slice(-6)}`;
};

let registerInFlight = false;
let lastRegisteredToken: string | null = null;
let refreshSubscription: { remove: () => void } | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const resolvePlatform = (): PushDevicePlatform | null => {
  if (Platform.OS === 'android') {
    return 'ANDROID';
  }
  if (Platform.OS === 'ios') {
    return 'IOS';
  }
  return null;
};

const resolveAppVersion = (): string =>
  Constants.expoConfig?.version?.trim() ||
  Constants.nativeAppVersion?.trim() ||
  '1.0.0';

const clearRetry = (): void => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

const scheduleRetry = (delayMs: number): void => {
  clearRetry();
  retryTimer = setTimeout(() => {
    pushDebugLog('stage: registration retry scheduled fired');
    void registerCurrentPushDevice({ requestPermissionIfNeeded: false });
  }, delayMs);
};

/**
 * Obtain native FCM/APNs device token (not Expo push token).
 * Requires a development/production build with Firebase google services files.
 */
export const getNativePushToken = async (): Promise<string | null> => {
  // Re-evaluate every call — do not cache a boot-time Constants snapshot.
  if (isNotificationsExpoGoEnvironment()) {
    pushDebugLog('stage: native env = Expo Go (FCM unavailable)', getPushEnvironmentSnapshot());
    return null;
  }
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    pushDebugError('stage: Firebase/notification module unavailable', getPushEnvironmentSnapshot());
    return null;
  }
  pushDebugLog('stage: Firebase/notification module available');
  try {
    pushDebugLog('stage: FCM token retrieval started');
    const devicePush = await Notifications.getDevicePushTokenAsync();
    const token = String(devicePush?.data ?? '').trim();
    if (!token) {
      pushDebugError('stage: FCM token retrieval failed (empty)');
      return null;
    }
    // Reject Expo push tokens — backend expects FCM/APNs device tokens only.
    if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
      pushDebugError('stage: FCM token retrieval failed (Expo push token rejected)', {
        tokenPreview: maskToken(token),
      });
      return null;
    }
    pushDebugLog('stage: FCM token retrieval succeeded', {
      type: devicePush?.type,
      tokenPreview: maskToken(token),
    });
    return token;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushDebugError('stage: FCM token retrieval failed', {
      message,
      hint:
        'Native APK must include google-services.json at build time. OTA cannot add Firebase. Rebuild preview APK.',
      ...getPushEnvironmentSnapshot(),
    });
    return null;
  }
};

export interface RegisterPushOptions {
  /** When true, may prompt the OS permission dialog (post-auth only). */
  requestPermissionIfNeeded?: boolean;
  /** When true, show a one-shot denial guidance alert after a denied prompt. */
  offerDenialGuidance?: boolean;
}

export type RegisterPushResult = {
  registered: boolean;
  /** True when the OS permission dialog was invoked this call. */
  didRequestPermission: boolean;
  permissionGranted: boolean;
};

/**
 * Register / refresh FCM token with POST /notifications/devices.
 * Never blocks login; retries lightly on network failure.
 */
export const registerCurrentPushDevice = async (
  options: RegisterPushOptions = {},
): Promise<boolean> => {
  const result = await registerCurrentPushDeviceDetailed(options);
  return result.registered;
};

/**
 * Same as registerCurrentPushDevice but returns whether a permission prompt ran.
 * Callers use this so promptedRef is not set when the request was skipped.
 */
export const registerCurrentPushDeviceDetailed = async (
  options: RegisterPushOptions = {},
): Promise<RegisterPushResult> => {
  const projectId = resolveEasProjectId();
  const isExpoGo = isNotificationsExpoGoEnvironment();

  pushDebugLog('stage: initialization started', {
    authenticated: authSession.isAuthenticated(),
    hydrated: authSession.isHydrated(),
    hasJwt: Boolean(authSession.getToken()),
    requestPermissionIfNeeded: Boolean(options.requestPermissionIfNeeded),
    projectId,
    projectIdMatch: projectId === EXPECTED_EAS_PROJECT_ID,
    registerInFlight,
    hasLastRegisteredToken: Boolean(lastRegisteredToken),
    storeClientEnum: ExecutionEnvironment.StoreClient,
    ...getPushEnvironmentSnapshot(),
  });

  if (!projectId) {
    pushDebugLog('skipped: missing project ID (continuing — FCM token does not require Expo projectId)');
  } else if (projectId !== EXPECTED_EAS_PROJECT_ID) {
    pushDebugError('projectId mismatch — expected BhaiWay EAS project', {
      projectId,
      expected: EXPECTED_EAS_PROJECT_ID,
    });
  }

  const emptyResult = (
    partial?: Partial<RegisterPushResult>,
  ): RegisterPushResult => ({
    registered: false,
    didRequestPermission: false,
    permissionGranted: false,
    ...partial,
  });

  if (!authSession.isAuthenticated() || !authSession.getToken()) {
    pushDebugLog('stage: skipped — authentication session not ready');
    return emptyResult();
  }
  pushDebugLog('stage: authentication session ready');

  if (isExpoGo) {
    pushDebugLog('stage: skipped — Expo Go (native FCM unavailable)', getPushEnvironmentSnapshot());
    return emptyResult();
  }
  pushDebugLog('stage: native environment detected (not Expo Go)');

  if (registerInFlight) {
    pushDebugLog('skipped: already initialized (registration in flight)');
    return emptyResult();
  }

  const platform = resolvePlatform();
  if (!platform) {
    pushDebugLog('skipped: unsupported platform', { os: Platform.OS });
    return emptyResult();
  }

  registerInFlight = true;
  let didRequestPermission = false;
  try {
    if (Platform.OS === 'android') {
      pushDebugLog('creating Android channel', { id: 'bhaiway_default' });
    }
    await ensureBhaiWayNotificationChannel();

    let details = await getNotificationPermissionDetails();
    pushDebugLog('stage: permission state checked', {
      status: details.status,
      granted: details.granted,
      canAskAgain: details.canAskAgain,
    });

    const shouldRequest = shouldRequestNotificationPermission({
      requestPermissionIfNeeded: Boolean(options.requestPermissionIfNeeded),
      details,
    });

    if (shouldRequest) {
      pushDebugLog('stage: permission request started');
      didRequestPermission = true;
      const afterStatus = await requestNotificationPermission();
      details = await getNotificationPermissionDetails();
      pushDebugLog('stage: permission request finished', {
        afterStatus,
        status: details.status,
        granted: details.granted,
        canAskAgain: details.canAskAgain,
      });
    } else {
      const reason = details.granted
        ? 'already_granted'
        : !options.requestPermissionIfNeeded
          ? 'request_not_allowed'
          : 'cannot_ask_again';
      pushDebugLog(`stage: permission request skipped (${reason})`, {
        status: details.status,
        granted: details.granted,
        canAskAgain: details.canAskAgain,
      });
    }

    if (!details.granted) {
      pushDebugLog('stage: skipped — permission not granted');
      if (
        didRequestPermission &&
        options.offerDenialGuidance !== false &&
        options.requestPermissionIfNeeded
      ) {
        maybeOfferNotificationPermissionHelp(details);
      }
      return emptyResult({ didRequestPermission, permissionGranted: false });
    }

    const token = await getNativePushToken();
    if (!token) {
      pushDebugLog('stage: skipped — no FCM token (will retry)');
      scheduleRetry(60_000);
      return emptyResult({ didRequestPermission, permissionGranted: true });
    }

    if (lastRegisteredToken === token) {
      await pushTokenStorage.setToken(token);
      pushDebugLog('stage: skipped — same FCM token already registered this session');
      pushDebugLog('stage: initialization completed');
      return { registered: true, didRequestPermission, permissionGranted: true };
    }

    const deviceId = await pushTokenStorage.getOrCreateDeviceId();
    const appVersion = resolveAppVersion();
    pushDebugLog('stage: authenticated device-registration request started', {
      platform,
      deviceIdPreview: maskToken(deviceId),
      appVersion,
      tokenPreview: maskToken(token),
      endpoint: '/notifications/devices',
    });

    try {
      await registerPushDevice({
        token,
        platform,
        deviceId,
        appVersion,
      });
      await pushTokenStorage.setToken(token);
      lastRegisteredToken = token;
      clearRetry();
      pushDebugLog('stage: backend registration response = success');
      pushDebugLog('stage: initialization completed');
      return { registered: true, didRequestPermission, permissionGranted: true };
    } catch (error) {
      const apiError =
        error && typeof error === 'object'
          ? (error as { status?: number; code?: string; message?: string })
          : null;
      pushDebugError('stage: backend registration failed', {
        status: apiError?.status,
        code: apiError?.code,
        message: apiError?.message || (error instanceof Error ? error.message : String(error)),
      });
      scheduleRetry(45_000);
      return emptyResult({ didRequestPermission, permissionGranted: true });
    }
  } catch (error) {
    const apiError =
      error && typeof error === 'object'
        ? (error as { status?: number; code?: string; message?: string })
        : null;
    pushDebugError('stage: registration failed', {
      status: apiError?.status,
      code: apiError?.code,
      message: apiError?.message || (error instanceof Error ? error.message : String(error)),
    });
    scheduleRetry(45_000);
    return emptyResult({ didRequestPermission });
  } finally {
    registerInFlight = false;
  }
};

/** Subscribe to native token rotation → re-POST same endpoint. */
export const startPushTokenRefreshListener = (): (() => void) => {
  if (isNotificationsExpoGoEnvironment()) {
    pushDebugLog('skipped: token refresh listener (Expo Go)');
    return () => undefined;
  }
  const Notifications = loadNotificationsModule();
  if (!Notifications?.addPushTokenListener) {
    pushDebugLog('skipped: token refresh listener (module unavailable)');
    return () => undefined;
  }
  if (refreshSubscription) {
    return () => {
      refreshSubscription?.remove();
      refreshSubscription = null;
    };
  }

  refreshSubscription = Notifications.addPushTokenListener((event) => {
    const token = String(event?.data ?? '').trim();
    if (!token || !authSession.isAuthenticated()) {
      return;
    }
    if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
      pushDebugError('stage: token refresh ignored (Expo push token)');
      return;
    }
    lastRegisteredToken = null;
    pushDebugLog('stage: token refresh or registration retry occurred', {
      tokenPreview: maskToken(token),
    });
    void (async () => {
      try {
        const platform = resolvePlatform();
        if (!platform) {
          return;
        }
        const deviceId = await pushTokenStorage.getOrCreateDeviceId();
        await registerPushDevice({
          token,
          platform,
          deviceId,
          appVersion: resolveAppVersion(),
        });
        await pushTokenStorage.setToken(token);
        lastRegisteredToken = token;
        pushDebugLog('stage: token refresh registration succeeded', {
          source: 'token_refresh',
        });
      } catch (error) {
        const apiError =
          error && typeof error === 'object'
            ? (error as { status?: number; code?: string; message?: string })
            : null;
        pushDebugError('stage: token refresh registration failed', {
          source: 'token_refresh',
          status: apiError?.status,
          code: apiError?.code,
          message:
            apiError?.message || (error instanceof Error ? error.message : String(error)),
        });
        scheduleRetry(45_000);
      }
    })();
  });

  return () => {
    refreshSubscription?.remove();
    refreshSubscription = null;
  };
};

/**
 * Logout: DELETE /notifications/devices/:token then clear local token.
 * Never throws — logout must complete even if unregister fails.
 */
export const unregisterCurrentPushDevice = async (): Promise<void> => {
  clearRetry();
  lastRegisteredToken = null;
  const token = await pushTokenStorage.getToken();
  if (token) {
    try {
      await unregisterPushDevice(token);
      pushDebugLog('backend unregister success', { tokenPreview: maskToken(token) });
    } catch (error) {
      pushDebugError('backend unregister failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  await pushTokenStorage.clearToken();
};
