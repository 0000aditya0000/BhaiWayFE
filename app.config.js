
/**
 * Expo app config — loads Maps keys from `.env` (EXPO_PUBLIC_*).
 * Do not commit real API keys into app.json; set them in `.env` instead.
 *
 * Firebase Cloud Messaging (push):
 *   Place native Firebase app configs at repo root:
 *     ./google-services.json          (Android, package com.bhaiway.app)
 *     ./GoogleService-Info.plist      (iOS, bundle com.bhaiway.app)
 *
 * Then restart: npx expo start -c
 */

const fs = require('fs');
const path = require('path');

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') continue;

    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('YOUR_')) continue;

    return trimmed;
  }

  return '';
};

const googleMapsApiKey = firstNonEmpty(
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  process.env.GOOGLE_MAPS_API_KEY,
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
  process.env.GOOGLE_PLACES_API_KEY,
);

const googlePlacesApiKey = firstNonEmpty(
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
  process.env.GOOGLE_PLACES_API_KEY,
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  process.env.GOOGLE_MAPS_API_KEY,
);

const mapsKey = googleMapsApiKey || googlePlacesApiKey;

const androidGoogleServices = path.join(
  __dirname,
  'google-services.json',
);
const iosGoogleServices = path.join(
  __dirname,
  'GoogleService-Info.plist',
);

/**
 * Resolve Firebase client configs for local and EAS builds.
 */
const ensureFirebaseClientFile = (destPath, envVarNames, label) => {
  if (fs.existsSync(destPath)) return true;

  for (const envName of envVarNames) {
    const fromEnv =
      typeof process.env[envName] === 'string'
        ? process.env[envName].trim()
        : '';

    if (!fromEnv || !fs.existsSync(fromEnv)) continue;

    try {
      fs.copyFileSync(fromEnv, destPath);
      console.log(`[app.config] Copied ${label} from $${envName}`);
      return true;
    } catch (error) {
      console.warn(
        `[app.config] Failed to copy ${label} from $${envName}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return false;
};

const hasAndroidGoogleServices = ensureFirebaseClientFile(
  androidGoogleServices,
  ['GOOGLE_SERVICES_JSON', 'GOOGLE_SERVICES_JSON_PATH'],
  'google-services.json',
);

const hasIosGoogleServices = ensureFirebaseClientFile(
  iosGoogleServices,
  [
    'GOOGLE_SERVICE_INFO_PLIST',
    'GOOGLE_SERVICES_PLIST',
    'GOOGLE_SERVICE_INFO_PLIST_PATH',
  ],
  'GoogleService-Info.plist',
);

if (!hasAndroidGoogleServices) {
  console.warn(
    '[app.config] google-services.json missing — Android FCM push will NOT work in this native build. ' +
      'Place the file at repo root (local) or set EAS file secret GOOGLE_SERVICES_JSON, then rebuild the APK.',
  );
}

/**
 * Validate Firebase client configuration against Expo identifiers.
 */
const assertFirebaseClientMatchesApp = (androidPackage, iosBundleId) => {
  if (fs.existsSync(androidGoogleServices)) {
    try {
      const googleServices = JSON.parse(
        fs.readFileSync(androidGoogleServices, 'utf8'),
      );

      const packages = (googleServices.client || [])
        .map(
          (client) =>
            client?.client_info?.android_client_info?.package_name,
        )
        .filter(Boolean);

      if (packages.length > 0 && !packages.includes(androidPackage)) {
        throw new Error(
          [
            `google-services.json has no Android client for package "${androidPackage}".`,
            `Found: ${packages.join(', ') || '(none)'}.`,
            `In Firebase Console → Project settings → Your apps, add an Android app with package "${androidPackage}",`,
            'download the updated google-services.json, replace the repo-root file, then rebuild.',
            'Do not change Expo android.package to match a wrong Firebase client.',
          ].join(' '),
        );
      }
    } catch (error) {
      if (
        error &&
        typeof error.message === 'string' &&
        error.message.includes('google-services.json')
      ) {
        throw error;
      }
    }
  }

  if (fs.existsSync(iosGoogleServices)) {
    try {
      const plist = fs.readFileSync(iosGoogleServices, 'utf8');
      const bundleMatch = plist.match(
        /<key>BUNDLE_ID<\/key>\s*<string>([^<]+)<\/string>/,
      );
      const plistBundle = bundleMatch?.[1]?.trim();

      if (plistBundle && plistBundle !== iosBundleId) {
        throw new Error(
          [
            `GoogleService-Info.plist BUNDLE_ID is "${plistBundle}" but Expo ios.bundleIdentifier is "${iosBundleId}".`,
            `Add an iOS app for "${iosBundleId}" in Firebase and replace GoogleService-Info.plist.`,
          ].join(' '),
        );
      }
    } catch (error) {
      if (
        error &&
        typeof error.message === 'string' &&
        error.message.includes('GoogleService-Info.plist')
      ) {
        throw error;
      }
    }
  }
};

module.exports = ({ config }) => {
  const androidPackage =
    config?.android?.package || 'com.bhaiway.app';

  const iosBundleId =
    config?.ios?.bundleIdentifier || 'com.bhaiway.app';

  assertFirebaseClientMatchesApp(androidPackage, iosBundleId);

  const existingPlugins = config.plugins ?? [];

  // Avoid adding the build-properties plugin more than once.
  const plugins = existingPlugins.filter(
    (plugin) =>
      (typeof plugin === 'string' ? plugin : plugin?.[0]) !==
      'expo-build-properties',
  );

  plugins.push([
    'expo-build-properties',
    {
      ios: {
        deploymentTarget: '15.1',
      },
    },
  ]);

  return {
    ...config,

    plugins,

    ios: {
      ...config.ios,
      ...(hasIosGoogleServices
        ? { googleServicesFile: './GoogleService-Info.plist' }
        : { googleServicesFile: undefined }),
      config: {
        ...(config.ios?.config ?? {}),
        googleMapsApiKey:
          mapsKey || config.ios?.config?.googleMapsApiKey || '',
      },
    },

    android: {
      ...config.android,
      ...(hasAndroidGoogleServices
        ? { googleServicesFile: './google-services.json' }
        : { googleServicesFile: undefined }),
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          ...(config.android?.config?.googleMaps ?? {}),
          apiKey:
            mapsKey ||
            config.android?.config?.googleMaps?.apiKey ||
            '',
        },
      },
    },

    extra: {
      ...(config.extra ?? {}),

      googleMapsApiKey: mapsKey,
      googlePlacesApiKey: googlePlacesApiKey || mapsKey,

      cloudinaryCloudName: firstNonEmpty(
        process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
        config.extra?.cloudinaryCloudName,
      ),

      cloudinaryUploadPreset: firstNonEmpty(
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        config.extra?.cloudinaryUploadPreset,
      ),

      msg91WidgetId: firstNonEmpty(
        process.env.EXPO_PUBLIC_MSG91_WIDGET_ID,
      ),

      msg91AuthToken: firstNonEmpty(
        process.env.EXPO_PUBLIC_MSG91_AUTH_TOKEN,
      ),

      googleSheetId: firstNonEmpty(
        process.env.EXPO_PUBLIC_GOOGLE_SHEET_ID,
        '1W_2ZuTbhrlMKuArAov4E5hzH11LtGs_s6xtiI98nj6w',
      ),

      googleSheetWebhookUrl: firstNonEmpty(
        process.env.EXPO_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL,
      ),
    },
  };
};
