import { requireOptionalNativeModule } from 'expo-modules-core';

type ExpoAv = typeof import('expo-av');

let cached: ExpoAv | null | undefined;

/**
 * Expo Go / an older native binary may have no ExponentAV.
 * Never `import 'expo-av'` at module scope — that throws before RootLayout
 * can export and Expo Router then crashes on `undefined.ErrorBoundary`.
 */
export const getExpoAv = (): ExpoAv | null => {
  if (cached !== undefined) {
    return cached;
  }
  if (!requireOptionalNativeModule('ExponentAV')) {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-av') as ExpoAv;
    return cached;
  } catch {
    cached = null;
    return null;
  }
};
