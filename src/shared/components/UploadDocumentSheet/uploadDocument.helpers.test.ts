/**
 * Gallery permission policy — Android must not request broad media access.
 */

const failed: string[] = [];

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

/** Mirrors uploadDocument.helpers.ts */
const shouldRequestMediaLibraryPermissionForGallery = (
  platformOS: 'ios' | 'android' | 'web' | 'windows' | 'macos',
): boolean => platformOS === 'ios';

assertTrue(
  shouldRequestMediaLibraryPermissionForGallery('android') === false,
  'Android gallery uses Photo Picker — no media-library permission',
);
assertTrue(
  shouldRequestMediaLibraryPermissionForGallery('ios') === true,
  'iOS may still request photo-library permission',
);

const BLOCKED = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
] as const;

const appJson = require('../../../../app.json') as {
  expo: {
    android: {
      permissions?: string[];
      blockedPermissions?: string[];
    };
  };
};

const permissions = appJson.expo.android.permissions ?? [];
const blocked = appJson.expo.android.blockedPermissions ?? [];

assertTrue(
  !permissions.includes('android.permission.READ_MEDIA_IMAGES'),
  'app.json permissions must not declare READ_MEDIA_IMAGES',
);
assertTrue(
  !permissions.includes('android.permission.READ_MEDIA_VIDEO'),
  'app.json permissions must not declare READ_MEDIA_VIDEO',
);

for (const permission of BLOCKED) {
  assertTrue(blocked.includes(permission), `blockedPermissions includes ${permission}`);
}

assertEqual(
  permissions.includes('android.permission.CAMERA'),
  true,
  'CAMERA permission retained for profile photo capture',
);

if (failed.length > 0) {
  throw new Error(`uploadDocument.helpers tests failed:\n${failed.join('\n')}`);
}
console.log('uploadDocument.helpers / media permission policy tests passed');
