export type SupportedLocationPlatform =
  | 'android'
  | 'ios'
  | 'web'
  | 'windows'
  | 'macos'
  | string;

export type LocationConsentStatus = 'not_prompted' | 'consented' | 'declined';

export interface LocationDisclosureRecord {
  status: 'consented' | 'declined';
  version: string;
  timestampMs: number;
  platform: SupportedLocationPlatform;
}

export type LocationPermissionLevel =
  | 'none'
  | 'services_disabled'
  | 'foreground'
  | 'background'
  | 'denied'
  | 'restricted';

export interface LocationPermissionSnapshot {
  servicesEnabled: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  consentStatus: LocationConsentStatus;
  hasAffirmativeConsent: boolean;
  requiresSettings: boolean;
  level: LocationPermissionLevel;
}

export interface PermissionFlowResult {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  consentGiven: boolean;
  settingsRequired: boolean;
}
