import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import type { NotificationPermissionStatus } from '../types';

/**
 * `expo-notifications` throws on import in Expo Go (Android, SDK 53+).
 * Keep the native module behind a lazy require and only use it in dev/prod builds.
 *
 * IMPORTANT: evaluate at call time — do not cache boot-time Constants.
 */
type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let channelReady = false;

/**
 * Tracks the last Android 13+ POST_NOTIFICATIONS dialog outcome.
 * `PermissionsAndroid.check` cannot distinguish never-asked vs denied;
 * expo-notifications often misreports never-asked as permanent deny.
 */
type AndroidPostNotificationsAskState =
  | 'unknown'
  | 'granted'
  | 'denied'
  | 'never_ask_again';

let androidPostNotificationsAskState: AndroidPostNotificationsAskState = 'unknown';

/** True after this JS runtime has shown the OS notification permission dialog. */
let osNotificationDialogShownThisSession = false;

export const wasOsNotificationDialogShownThisSession = (): boolean =>
  osNotificationDialogShownThisSession;

/**
 * True only inside Expo Go (no native FCM).
 *
 * Use appOwnership === 'expo' only. Do NOT treat StoreClient alone as Expo Go —
 * some standalone / OTA-updated builds have been misclassified, which permanently
 * skips FCM registration (`isExpoGo: true` with no POST /notifications/devices).
 */
export const isNotificationsExpoGoEnvironment = (): boolean =>
  Constants.appOwnership === 'expo';

/** Diagnostics snapshot for [PUSH] logs (never secrets). */
export const getPushEnvironmentSnapshot = (): Record<string, unknown> => ({
  appOwnership: Constants.appOwnership ?? null,
  executionEnvironment: Constants.executionEnvironment ?? null,
  isExpoGo: isNotificationsExpoGoEnvironment(),
  isStandalone:
    Constants.executionEnvironment === ExecutionEnvironment.Standalone ||
    Constants.executionEnvironment === ExecutionEnvironment.Bare,
  platformOS: Platform.OS,
  platformVersion: Platform.Version,
  androidAskState: androidPostNotificationsAskState,
});

export const loadNotificationsModule = (): NotificationsModule | null => {
  if (isNotificationsExpoGoEnvironment()) {
    return null;
  }

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    // Lazy require avoids the Expo Go Android crash on static import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    notificationsModule = null;
  }

  return notificationsModule;
};

/** Backend FCM Android channel id. */
export const BHAIWAY_NOTIFICATION_CHANNEL_ID = 'bhaiway_default';

/** In-memory permission state used when native push APIs are unavailable (Expo Go). */
let expoGoPermissionStatus: NotificationPermissionStatus = 'undetermined';

export type NotificationPermissionDetails = {
  status: NotificationPermissionStatus;
  granted: boolean;
  /** Android: true when the OS can still show the POST_NOTIFICATIONS dialog. */
  canAskAgain: boolean;
};

const mapStatus = (status: string): NotificationPermissionStatus => {
  // iOS provisional still delivers quietly — treat as usable for token registration.
  if (status === 'granted' || status === 'provisional') {
    return 'granted';
  }
  if (status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
};

export const getAndroidApiLevel = (): number | null => {
  if (Platform.OS !== 'android') {
    return null;
  }
  const apiLevel =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : Number.parseInt(String(Platform.Version), 10);
  return Number.isFinite(apiLevel) ? apiLevel : null;
};

/**
 * Pure decision: should we show the OS notification permission dialog?
 * Never-asked on Android 13+ must NOT be treated as permanent denial.
 */
export const shouldRequestNotificationPermission = (input: {
  requestPermissionIfNeeded: boolean;
  details: NotificationPermissionDetails;
}): boolean => {
  if (!input.requestPermissionIfNeeded || input.details.granted) {
    return false;
  }
  return input.details.status === 'undetermined' || input.details.canAskAgain;
};

/**
 * Create/reuse Android channel `bhaiway_default` with sound + high importance.
 * Idempotent — safe across launches.
 */
export const ensureBhaiWayNotificationChannel = async (): Promise<void> => {
  if (channelReady || Platform.OS !== 'android') {
    return;
  }
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(BHAIWAY_NOTIFICATION_CHANNEL_ID, {
      name: 'BhaiWay',
      description: 'Ride, chat, and wallet alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#374BB1',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    channelReady = true;
  } catch {
    // Channel may already exist from a previous launch.
    channelReady = true;
  }
};

/**
 * Android 13+ (API 33): request POST_NOTIFICATIONS via PermissionsAndroid.
 * expo-notifications alone can miss the system dialog on some devices/builds.
 */
const requestAndroidPostNotificationsPermission = async (): Promise<
  'granted' | 'denied' | 'undetermined'
> => {
  if (Platform.OS !== 'android') {
    return 'undetermined';
  }
  const apiLevel = getAndroidApiLevel();
  if (apiLevel == null || apiLevel < 33) {
    return 'granted';
  }

  try {
    const existing = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (existing) {
      androidPostNotificationsAskState = 'granted';
      return 'granted';
    }

    osNotificationDialogShownThisSession = true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      androidPostNotificationsAskState = 'granted';
      return 'granted';
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      androidPostNotificationsAskState = 'never_ask_again';
      return 'denied';
    }
    androidPostNotificationsAskState = 'denied';
    return 'denied';
  } catch {
    return 'undetermined';
  }
};

/**
 * Read permission state.
 *
 * Android 13+ critical: before the first POST_NOTIFICATIONS request,
 * `expo-notifications.getPermissionsAsync()` often reports `denied` with
 * `canAskAgain: false` even though the OS dialog has never been shown.
 * That permanently skipped `PermissionsAndroid.request` in production APKs.
 */
export const getNotificationPermissionDetails =
  async (): Promise<NotificationPermissionDetails> => {
    if (Platform.OS === 'android') {
      const apiLevel = getAndroidApiLevel();
      if (apiLevel != null && apiLevel >= 33) {
        try {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (granted) {
            androidPostNotificationsAskState = 'granted';
            return { status: 'granted', granted: true, canAskAgain: true };
          }

          if (androidPostNotificationsAskState === 'never_ask_again') {
            return { status: 'denied', granted: false, canAskAgain: false };
          }
          if (androidPostNotificationsAskState === 'denied') {
            // Soft deny — OS may still show the dialog again later.
            return { status: 'denied', granted: false, canAskAgain: true };
          }

          // Never asked (or unknown): treat as requestable. Do NOT trust expo's
          // premature denied/canAskAgain=false for API 33+.
          return { status: 'undetermined', granted: false, canAskAgain: true };
        } catch {
          // Fall through to expo-notifications.
        }
      }
    }

    const Notifications = loadNotificationsModule();
    if (!Notifications) {
      return {
        status: expoGoPermissionStatus,
        granted: expoGoPermissionStatus === 'granted',
        canAskAgain: expoGoPermissionStatus === 'undetermined',
      };
    }

    try {
      const settings = await Notifications.getPermissionsAsync();
      const status = mapStatus(settings.status);
      return {
        status,
        granted: Boolean(settings.granted) || status === 'granted',
        canAskAgain: settings.canAskAgain !== false,
      };
    } catch {
      return { status: 'undetermined', granted: false, canAskAgain: true };
    }
  };

export const getNotificationPermissionStatus =
  async (): Promise<NotificationPermissionStatus> => {
    const details = await getNotificationPermissionDetails();
    return details.status;
  };

export const requestNotificationPermission =
  async (): Promise<NotificationPermissionStatus> => {
    const Notifications = loadNotificationsModule();
    if (!Notifications) {
      // Expo Go cannot request real push permission on Android SDK 53+.
      expoGoPermissionStatus = 'granted';
      return expoGoPermissionStatus;
    }

    try {
      await ensureBhaiWayNotificationChannel();

      // Android 13+: explicit POST_NOTIFICATIONS runtime request first.
      const androidResult = await requestAndroidPostNotificationsPermission();
      if (androidResult === 'granted') {
        // Still sync expo-notifications permission state for iOS parity / listeners.
        try {
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
        } catch {
          // Android already granted via PermissionsAndroid.
        }
        return 'granted';
      }

      // Android 13+: PermissionsAndroid already asked; do not treat a follow-up
      // expo-notifications denial as "never ask again" if the OS can still ask.
      if (Platform.OS === 'android' && androidResult === 'denied') {
        return 'denied';
      }

      osNotificationDialogShownThisSession = true;
      const settings = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      return mapStatus(settings.status);
    } catch {
      return 'denied';
    }
  };

/** Opens the OS app settings page (for permanent notification denial). */
export const openAppNotificationSettings = (): void => {
  void Linking.openSettings();
};

/** Test helper — resets Android ask-state and Expo Go stub. */
export const __resetNotificationPermissionStateForTests = (): void => {
  androidPostNotificationsAskState = 'unknown';
  osNotificationDialogShownThisSession = false;
  expoGoPermissionStatus = 'undetermined';
  channelReady = false;
  notificationsModule = undefined;
};
