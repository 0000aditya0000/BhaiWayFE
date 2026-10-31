import * as Location from 'expo-location';

export interface IosPermissionState {
  servicesEnabled: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  canAskForeground: boolean;
  canAskBackground: boolean;
  requiresSettings: boolean;
}

export const iosLocationPermissionHandler = {
  async checkStatus(): Promise<IosPermissionState> {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

      const foregroundGranted = fg.status === Location.PermissionStatus.GRANTED;
      const backgroundGranted = bg.status === Location.PermissionStatus.GRANTED;

      const requiresSettings =
        (!foregroundGranted && !fg.canAskAgain) ||
        (foregroundGranted && !backgroundGranted && !bg.canAskAgain);

      return {
        servicesEnabled,
        foregroundGranted,
        backgroundGranted,
        canAskForeground: fg.canAskAgain,
        canAskBackground: bg.canAskAgain,
        requiresSettings,
      };
    } catch {
      return {
        servicesEnabled: false,
        foregroundGranted: false,
        backgroundGranted: false,
        canAskForeground: true,
        canAskBackground: true,
        requiresSettings: false,
      };
    }
  },

  async requestForeground(): Promise<boolean> {
    try {
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status === Location.PermissionStatus.GRANTED) {
        return true;
      }
      const requested = await Location.requestForegroundPermissionsAsync();
      return requested.status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  },

  async requestBackground(): Promise<boolean> {
    try {
      const existing = await Location.getBackgroundPermissionsAsync();
      if (existing.status === Location.PermissionStatus.GRANTED) {
        return true;
      }
      const requested = await Location.requestBackgroundPermissionsAsync();
      return requested.status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  },
};
