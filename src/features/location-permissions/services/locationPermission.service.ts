import { Linking, Platform } from 'react-native';

import { androidLocationPermissionHandler } from '../handlers/androidLocationPermission';
import { iosLocationPermissionHandler } from '../handlers/iosLocationPermission';
import { locationConsentService } from './locationConsent.service';
import type {
  LocationPermissionLevel,
  LocationPermissionSnapshot,
  PermissionFlowResult,
} from '../types/locationPermission.types';

export const locationPermissionService = {
  async getSnapshot(): Promise<LocationPermissionSnapshot> {
    const isIos = Platform.OS === 'ios';
    const handler = isIos
      ? iosLocationPermissionHandler
      : androidLocationPermissionHandler;

    const state = await handler.checkStatus();
    const consentRecord = await locationConsentService.getConsentRecord();
    const hasConsent = await locationConsentService.hasAffirmativeConsent();
    const consentStatus = await locationConsentService.getConsentStatus();

    let level: LocationPermissionLevel = 'none';
    if (!state.servicesEnabled) {
      level = 'services_disabled';
    } else if (state.backgroundGranted) {
      level = 'background';
    } else if (state.foregroundGranted) {
      level = 'foreground';
    } else if (state.requiresSettings) {
      level = 'restricted';
    }

    return {
      servicesEnabled: state.servicesEnabled,
      foregroundGranted: state.foregroundGranted,
      backgroundGranted: state.backgroundGranted,
      consentStatus,
      hasAffirmativeConsent: hasConsent,
      requiresSettings: state.requiresSettings,
      level,
    };
  },

  async canStartBackgroundTracking(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    const hasConsent = await locationConsentService.hasAffirmativeConsent();
    if (!hasConsent) {
      return false;
    }
    const isIos = Platform.OS === 'ios';
    const handler = isIos
      ? iosLocationPermissionHandler
      : androidLocationPermissionHandler;
    const state = await handler.checkStatus();
    return state.servicesEnabled && state.backgroundGranted;
  },

  async requestForegroundOnly(): Promise<boolean> {
    const isIos = Platform.OS === 'ios';
    const handler = isIos
      ? iosLocationPermissionHandler
      : androidLocationPermissionHandler;
    return handler.requestForeground();
  },

  /**
   * Request background location permission.
   * STRICT POLICY CHECK: Will refuse to prompt OS background permission
   * unless affirmative user consent has been obtained.
   */
  async requestBackgroundPermissionAfterConsent(): Promise<PermissionFlowResult> {
    const hasConsent = await locationConsentService.hasAffirmativeConsent();
    if (!hasConsent) {
      return {
        foregroundGranted: false,
        backgroundGranted: false,
        consentGiven: false,
        settingsRequired: false,
      };
    }

    const isIos = Platform.OS === 'ios';
    const handler = isIos
      ? iosLocationPermissionHandler
      : androidLocationPermissionHandler;

    // 1. Ensure foreground is granted first (Android & iOS requirement)
    let fgGranted = false;
    const initialStatus = await handler.checkStatus();
    if (initialStatus.foregroundGranted) {
      fgGranted = true;
    } else {
      fgGranted = await handler.requestForeground();
    }

    if (!fgGranted) {
      const statusAfter = await handler.checkStatus();
      return {
        foregroundGranted: false,
        backgroundGranted: false,
        consentGiven: true,
        settingsRequired: statusAfter.requiresSettings,
      };
    }

    // 2. Request background permission
    const bgGranted = await handler.requestBackground();
    const finalStatus = await handler.checkStatus();

    return {
      foregroundGranted: true,
      backgroundGranted: bgGranted || finalStatus.backgroundGranted,
      consentGiven: true,
      settingsRequired: !bgGranted && finalStatus.requiresSettings,
    };
  },

  openSettings(): void {
    void Linking.openSettings();
  },
};
