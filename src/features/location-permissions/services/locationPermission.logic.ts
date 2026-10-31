import { CURRENT_DISCLOSURE_VERSION } from '../config/locationDisclosure.constants';
import type {
  LocationConsentStatus,
  LocationDisclosureRecord,
  LocationPermissionLevel,
} from '../types/locationPermission.types';

export interface LocationPermissionStateInput {
  servicesEnabled: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  canAskForeground: boolean;
  canAskBackground: boolean;
}

export const isConsentRecordValid = (
  record: LocationDisclosureRecord | null | undefined,
  currentVersion: string = CURRENT_DISCLOSURE_VERSION,
): boolean => {
  if (!record || typeof record !== 'object') {
    return false;
  }
  return record.status === 'consented' && record.version === currentVersion;
};

export const resolvePermissionLevel = (
  state: LocationPermissionStateInput,
): LocationPermissionLevel => {
  if (!state.servicesEnabled) {
    return 'services_disabled';
  }
  if (state.backgroundGranted) {
    return 'background';
  }
  if (state.foregroundGranted) {
    return 'foreground';
  }
  if (!state.canAskForeground) {
    return 'restricted';
  }
  return 'none';
};

/**
 * Determines whether background updates (LocationTaskService / startLocationUpdatesAsync)
 * are permitted to start.
 *
 * GOOGLE PLAY COMPLIANCE:
 * Background tracking is NEVER started without both affirmative disclosure consent
 * AND granted background permission.
 */
export const canStartBackgroundTrackingUpdates = (input: {
  hasAffirmativeConsent: boolean;
  backgroundGranted: boolean;
  servicesEnabled: boolean;
  rideInProgress: boolean;
}): boolean => {
  if (!input.rideInProgress) {
    return false;
  }
  if (!input.servicesEnabled) {
    return false;
  }
  if (!input.hasAffirmativeConsent) {
    return false;
  }
  return input.backgroundGranted;
};

/**
 * Determines whether prominent disclosure must be presented to the driver.
 */
export const shouldPromptLocationDisclosure = (input: {
  hasAffirmativeConsent: boolean;
  backgroundGranted: boolean;
  rideInProgress: boolean;
}): boolean => {
  if (!input.rideInProgress) {
    return false;
  }
  // If driver has already granted background permission AND has valid affirmative consent, don't prompt
  if (input.backgroundGranted && input.hasAffirmativeConsent) {
    return false;
  }
  return !input.hasAffirmativeConsent;
};

/**
 * Determines whether user must navigate to Settings to enable background permission.
 */
export const shouldDirectToSettings = (input: {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  canAskBackground: boolean;
  canAskForeground: boolean;
}): boolean => {
  if (input.backgroundGranted) {
    return false;
  }
  // Foreground blocked
  if (!input.foregroundGranted && !input.canAskForeground) {
    return true;
  }
  // Foreground granted but background blocked (e.g. Android 11+ or iOS "Keep Only While Using")
  if (input.foregroundGranted && !input.canAskBackground) {
    return true;
  }
  return false;
};

/**
 * Determines fallback tracking mode when background permission is denied or declined.
 */
export const resolveTrackingMode = (input: {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  hasAffirmativeConsent: boolean;
}): 'none' | 'foreground_only' | 'full_background' => {
  if (!input.foregroundGranted) {
    return 'none';
  }
  if (input.hasAffirmativeConsent && input.backgroundGranted) {
    return 'full_background';
  }
  return 'foreground_only';
};
