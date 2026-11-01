import * as Haptics from 'expo-haptics';

import { isIOS } from './platform';

/** Light impact feedback; iOS only to avoid inconsistent Android vibration. */
export const triggerLightHaptic = (): void => {
  if (!isIOS) {
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Selection feedback for toggles and radio-style controls; iOS only. */
export const triggerSelectionHaptic = (): void => {
  if (!isIOS) {
    return;
  }
  void Haptics.selectionAsync().catch(() => {});
};

/** Success/error notification haptics; iOS only. */
export const triggerNotificationHaptic = (type: Haptics.NotificationFeedbackType): void => {
  if (!isIOS) {
    return;
  }
  void Haptics.notificationAsync(type).catch(() => {});
};

export const triggerSuccessHaptic = (): void => {
  triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
};

export const triggerErrorHaptic = (): void => {
  triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
};
