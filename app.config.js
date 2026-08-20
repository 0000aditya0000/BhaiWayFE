/**
 * Expo app config — loads Maps keys from `.env` (EXPO_PUBLIC_*).
 * Do not commit real API keys into app.json; set them in `.env` instead.
 *
 * Required for native maps + Places search:
 *   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
 *   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=...   (can be the same key)
 *
 * Then restart: npx expo start -c
 *
 * `config` is the static Expo config from app.json.
 */
const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('YOUR_')) {
      continue;
    }
    return trimmed;
  }
  return '';
};

const googleMapsApiKey = firstNonEmpty(
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
);

const googlePlacesApiKey = firstNonEmpty(
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
);

/** One key is enough for both Maps SDK and Places if APIs are enabled on that key. */
const mapsKey = googleMapsApiKey || googlePlacesApiKey;

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config ?? {}),
      googleMapsApiKey: mapsKey || config.ios?.config?.googleMapsApiKey || '',
    },
  },
  android: {
    ...config.android,
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        ...(config.android?.config?.googleMaps ?? {}),
        apiKey: mapsKey || config.android?.config?.googleMaps?.apiKey || '',
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
    msg91WidgetId: firstNonEmpty(process.env.EXPO_PUBLIC_MSG91_WIDGET_ID),
    msg91AuthToken: firstNonEmpty(process.env.EXPO_PUBLIC_MSG91_AUTH_TOKEN),
    googleSheetId: firstNonEmpty(
      process.env.EXPO_PUBLIC_GOOGLE_SHEET_ID,
      '1W_2ZuTbhrlMKuArAov4E5hzH11LtGs_s6xtiI98nj6w',
    ),
    googleSheetWebhookUrl: firstNonEmpty(process.env.EXPO_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL),
  },
});
