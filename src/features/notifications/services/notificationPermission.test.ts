/**
 * Pure permission-decision tests (no React Native runtime).
 * Mirrors shouldRequestNotificationPermission / route timing rules.
 */

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

type Details = {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
};

/** Copy of production helper — keep in sync with notificationPermission.ts */
const shouldRequestNotificationPermission = (input: {
  requestPermissionIfNeeded: boolean;
  details: Details;
}): boolean => {
  if (!input.requestPermissionIfNeeded || input.details.granted) {
    return false;
  }
  return input.details.status === 'undetermined' || input.details.canAskAgain;
};

/** Android 13+ never-asked must be treated as requestable (not permanent deny). */
const mapAndroid13UncheckedPermission = (askState: 'unknown' | 'denied' | 'never_ask_again'): Details => {
  if (askState === 'never_ask_again') {
    return { status: 'denied', granted: false, canAskAgain: false };
  }
  if (askState === 'denied') {
    return { status: 'denied', granted: false, canAskAgain: true };
  }
  return { status: 'undetermined', granted: false, canAskAgain: true };
};

// 1. Not requested → request is invoked
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: mapAndroid13UncheckedPermission('unknown'),
  }),
  'never-asked Android 13+ triggers request',
);
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: { status: 'undetermined', granted: false, canAskAgain: true },
  }),
  'undetermined triggers request',
);

// 2. Already granted → no prompt
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: { status: 'granted', granted: true, canAskAgain: true },
  }) === false,
  'granted skips request',
);

// 3. Soft deny → eligible retry not blocked
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: mapAndroid13UncheckedPermission('denied'),
  }),
  'soft deny canAskAgain still requests',
);

// 4. Permanent deny → no OS dialog (settings path instead)
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: mapAndroid13UncheckedPermission('never_ask_again'),
  }) === false,
  'never_ask_again does not re-request OS dialog',
);

// 5. requestPermissionIfNeeded false → never prompt (resume path)
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: false,
    details: mapAndroid13UncheckedPermission('unknown'),
  }) === false,
  'resume without flag does not prompt',
);

// 6. Misreported expo deny must NOT permanently suppress (regression)
const expoMisreport: Details = { status: 'denied', granted: false, canAskAgain: false };
// Production code avoids this misreport by not consulting expo before first ask.
// If askState is unknown, we force undetermined/canAskAgain true instead:
const corrected = mapAndroid13UncheckedPermission('unknown');
assertTrue(corrected.canAskAgain === true, 'unknown ask state remains requestable');
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: corrected,
  }),
  'corrected never-asked still requests (expo misreport bypass)',
);
assertTrue(
  shouldRequestNotificationPermission({
    requestPermissionIfNeeded: true,
    details: expoMisreport,
  }) === false,
  'raw expo misreport would skip — proves why Android 13+ branch must override it',
);

// 7. Splash/auth delay: promptedRef only set after real ask/grant
const createPromptedGuard = () => {
  let prompted = false;
  return {
    markFromResult(result: { didRequestPermission: boolean; permissionGranted: boolean }) {
      if (result.didRequestPermission || result.permissionGranted) {
        prompted = true;
      }
    },
    get prompted() {
      return prompted;
    },
  };
};
const guard = createPromptedGuard();
guard.markFromResult({ didRequestPermission: false, permissionGranted: false });
assertTrue(guard.prompted === false, 'skipped registration does not set promptedRef');
guard.markFromResult({ didRequestPermission: true, permissionGranted: false });
assertTrue(guard.prompted === true, 'actual OS request sets promptedRef');

// 8. Expo Go: native-only ops skipped
const isExpoGo = (appOwnership: string | null | undefined): boolean => appOwnership === 'expo';
assertTrue(isExpoGo('expo') === true, 'Expo Go detected');
assertTrue(isExpoGo(null) === false, 'native APK not Expo Go');

assertEqual(failed.length, 0, 'no failures');
if (failed.length > 0) {
  throw new Error(`notificationPermission tests failed:\n${failed.join('\n')}`);
}
console.log('notificationPermission tests passed');
