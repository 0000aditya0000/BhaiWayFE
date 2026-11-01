export const LOCATION_DISCLOSURE_STORAGE_KEY = '@bhaiway/location_disclosure_consent_v1';
export const CURRENT_DISCLOSURE_VERSION = 'v1.0';

export interface DisclosureConfig {
  title: string;
  badgeText: string;
  primaryExplanation: string;
  bulletPoints: readonly {
    icon: 'location-outline' | 'people-outline' | 'shield-checkmark-outline' | 'timer-outline';
    title: string;
    description: string;
  }[];
  privacyNote: string;
  continueButtonText: string;
  notNowButtonText: string;
}

export const ANDROID_DISCLOSURE_CONFIG: DisclosureConfig = {
  title: 'Location Access & Tracking',
  badgeText: 'Location Access',
  primaryExplanation:
    'BhaiWay collects location data to enable live driver tracking, passenger arrival updates, and route navigation even when the app is closed or not in use.',
  bulletPoints: [
    {
      icon: 'people-outline',
      title: 'Passenger Trip Following',
      description:
        'Your live location is shared with confirmed passengers during your active ride so they can follow your arrival and trip progress in real time.',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety & Emergency Response',
      description:
        'Your location data is transmitted to BhaiWay servers and made available to authorized people involved in your active ride and emergency (SOS) operations.',
    },
    {
      icon: 'timer-outline',
      title: 'Active Ride Only',
      description:
        'Background location tracking is strictly limited to your active ride and stops immediately once the trip is completed or cancelled.',
    },
  ],
  privacyNote:
    'BhaiWay does not track your location when you are off-duty or outside an active ride. You can manage or revoke location access at any time in Android Settings.',
  continueButtonText: 'Accept & Continue',
  notNowButtonText: 'Not now',
};

export const IOS_DISCLOSURE_CONFIG: DisclosureConfig = {
  title: 'Location Access & Tracking',
  badgeText: 'Location Access',
  primaryExplanation:
    'BhaiWay collects location data to enable live driver tracking, passenger arrival updates, and route navigation even when the app is in the background or minimized.',
  bulletPoints: [
    {
      icon: 'location-outline',
      title: 'Background Updates',
      description:
        'Location updates continue when BhaiWay is in the background or your screen is locked, ensuring passengers can follow your journey while you navigate.',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety & Operations',
      description:
        'Your location is shared only with confirmed riders on this trip and authorized emergency safety personnel.',
    },
    {
      icon: 'timer-outline',
      title: 'Active Ride Only',
      description:
        'Location access is used solely for active ride tracking and is never used for continuous tracking outside an eligible active trip.',
    },
  ],
  privacyNote:
    'Location sharing automatically terminates when the ride finishes or is cancelled. You can change permissions in iOS Settings at any time.',
  continueButtonText: 'Accept & Continue',
  notNowButtonText: 'Not now',
};

export const SETTINGS_GUIDANCE_COPY = {
  android: {
    title: 'Enable Background Location',
    subtitle: 'To keep sharing your trip while using GPS navigation',
    steps: [
      'Tap "Open Settings" below.',
      'Select "Permissions", then tap "Location".',
      'Select "Allow all the time".',
      'Return to BhaiWay to continue your ride.',
    ],
    buttonText: 'Open Settings',
    dismissText: 'Cancel',
  },
  ios: {
    title: 'Allow Always Location',
    subtitle: 'To share your live trip when BhaiWay is minimized',
    steps: [
      'Tap "Open Settings" below.',
      'Tap "Location".',
      'Select "Always" and ensure "Precise Location" is enabled.',
      'Return to BhaiWay to resume live trip sharing.',
    ],
    buttonText: 'Open Settings',
    dismissText: 'Cancel',
  },
} as const;
