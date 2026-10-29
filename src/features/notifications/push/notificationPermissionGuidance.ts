import { showAppAlert } from '@/store';

import {
  getNotificationPermissionDetails,
  openAppNotificationSettings,
  requestNotificationPermission,
  type NotificationPermissionDetails,
} from '../services/notificationPermission';
import { pushDebugLog } from './pushDebug';

let denialGuidanceShownThisSession = false;

/**
 * After a denied OS prompt, explain value and offer retry or Settings.
 * Once per JS session — does not spam on every resume.
 */
export const maybeOfferNotificationPermissionHelp = (
  details: NotificationPermissionDetails,
): void => {
  if (details.granted || denialGuidanceShownThisSession) {
    return;
  }
  denialGuidanceShownThisSession = true;

  if (details.canAskAgain) {
    pushDebugLog('stage: showing permission retry guidance');
    showAppAlert(
      'Stay updated on your rides',
      'BhaiWay uses notifications for booking updates, trip alerts, and chat. You can enable them now.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Allow notifications',
          onPress: () => {
            void (async () => {
              const status = await requestNotificationPermission();
              if (status !== 'granted') {
                return;
              }
              const { registerCurrentPushDevice } = await import('./pushRegistration');
              void registerCurrentPushDevice({ requestPermissionIfNeeded: false });
            })();
          },
        },
      ],
    );
    return;
  }

  pushDebugLog('stage: showing open-settings guidance (cannot ask again)');
  showAppAlert(
    'Notifications are off',
    'Enable notifications in system settings so you don’t miss ride updates, bookings, and chat messages.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Open settings',
        onPress: () => openAppNotificationSettings(),
      },
    ],
  );
};

/** Re-check permission after returning from Settings (app resume). */
export const refreshPermissionAfterSettingsReturn = async (): Promise<boolean> => {
  const details = await getNotificationPermissionDetails();
  if (!details.granted) {
    return false;
  }
  const { registerCurrentPushDevice } = await import('./pushRegistration');
  return registerCurrentPushDevice({ requestPermissionIfNeeded: false });
};

export const __resetPermissionGuidanceForTests = (): void => {
  denialGuidanceShownThisSession = false;
};
