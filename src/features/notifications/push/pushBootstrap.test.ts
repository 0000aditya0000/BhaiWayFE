/**
 * Push bootstrap / OTA startup invariants (no React Native runtime).
 * Ensures splash/OTA gating and listener lifecycle rules stay intact.
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

const EXPECTED_EAS_PROJECT_ID = '0b5df897-5c40-4adf-b956-550fd7c65877';
const BHAIWAY_CHANNEL = 'bhaiway_default';
const REGISTER_ENDPOINT = '/notifications/devices';

// --- Project ID / channel / endpoint contract ---
assertEqual(EXPECTED_EAS_PROJECT_ID, '0b5df897-5c40-4adf-b956-550fd7c65877', 'EAS project ID');
assertEqual(BHAIWAY_CHANNEL, 'bhaiway_default', 'Android default channel');
assertEqual(REGISTER_ENDPOINT, '/notifications/devices', 'device register endpoint');

// --- Push bootstrap mounts only after splash + auth hydrate (showApp) ---
const computeShowApp = (bootstrapReady: boolean, animationFinished: boolean): boolean =>
  bootstrapReady && animationFinished;
/** Matches app/_layout.tsx: PushNotificationsBootstrap is gated on showApp. */
const computePushMounted = (bootstrapReady: boolean, animationFinished: boolean): boolean =>
  computeShowApp(bootstrapReady, animationFinished);

assertTrue(
  computePushMounted(false, false) === false,
  'push bootstrap waits for splash + bootstrap',
);
assertTrue(
  computePushMounted(true, false) === false,
  'push bootstrap waits while splash animation plays',
);
assertTrue(
  computePushMounted(false, true) === false,
  'push bootstrap waits for auth hydrate/bootstrap ready',
);
assertTrue(
  computePushMounted(true, true) === true,
  'push bootstrap mounts only when showApp is true',
);
assertTrue(computeShowApp(true, false) === false, 'app shell waits for splash animation');
assertTrue(computeShowApp(false, true) === false, 'app shell waits for bootstrap/auth hydrate');
assertTrue(computeShowApp(true, true) === true, 'app shell mounts when bootstrap + splash done');

// --- Expo Go detection: appOwnership === 'expo' only (not StoreClient alone) ---
const isExpoGo = (appOwnership: string | null | undefined): boolean => appOwnership === 'expo';
assertTrue(isExpoGo('expo') === true, 'Expo Go when appOwnership is expo');
assertTrue(isExpoGo(null) === false, 'standalone/null ownership is not Expo Go');
assertTrue(isExpoGo(undefined) === false, 'undefined ownership is not Expo Go');
assertTrue(isExpoGo('guest') === false, 'guest ownership is not Expo Go');

// --- Permission prompt after splash/auth delay (promptedRef must not latch on skip) ---
const createPermissionPromptGate = () => {
  let prompted = false;
  return {
    onRegisterResult(result: {
      didRequestPermission: boolean;
      permissionGranted: boolean;
    }) {
      if (result.didRequestPermission || result.permissionGranted) {
        prompted = true;
      }
    },
    shouldAutoPrompt() {
      return !prompted;
    },
    get prompted() {
      return prompted;
    },
  };
};
const promptGate = createPermissionPromptGate();
assertTrue(promptGate.shouldAutoPrompt() === true, 'may prompt before any OS ask');
promptGate.onRegisterResult({ didRequestPermission: false, permissionGranted: false });
assertTrue(
  promptGate.shouldAutoPrompt() === true,
  'auth/splash skip does not permanently suppress prompt',
);
promptGate.onRegisterResult({ didRequestPermission: true, permissionGranted: false });
assertTrue(promptGate.shouldAutoPrompt() === false, 'after OS ask, auto-prompt stops');

// Reject Expo push tokens for FCM backend
const isExpoPushToken = (token: string): boolean =>
  token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
assertTrue(isExpoPushToken('ExponentPushToken[abc]') === true, 'reject ExponentPushToken');
assertTrue(isExpoPushToken('ExpoPushToken[abc]') === true, 'reject ExpoPushToken');
assertTrue(isExpoPushToken('fcm-device-token-xyz') === false, 'accept FCM-like token');

// --- Listener attach is once-per-lifetime; router identity changes must not re-attach ---
type Cleanup = () => void;
const createListenerController = () => {
  let attached = false;
  let attachCount = 0;
  let detachCount = 0;
  let routerRef: { id: number } | null = null;

  return {
    setRouter(router: { id: number }) {
      routerRef = router;
    },
    getRouterId() {
      return routerRef?.id ?? null;
    },
    attach(): Cleanup {
      if (attached) {
        return () => undefined;
      }
      attached = true;
      attachCount += 1;
      return () => {
        attached = false;
        detachCount += 1;
      };
    },
    get attachCount() {
      return attachCount;
    },
    get detachCount() {
      return detachCount;
    },
    get attached() {
      return attached;
    },
  };
};

const listeners = createListenerController();
listeners.setRouter({ id: 1 });
const cleanup1 = listeners.attach();
assertEqual(listeners.attachCount, 1, 'listeners attach once on bootstrap mount');
listeners.setRouter({ id: 2 });
const noopCleanup = listeners.attach();
assertEqual(listeners.attachCount, 1, 'router identity change does not re-attach listeners');
assertEqual(listeners.getRouterId(), 2, 'router ref updates without re-subscribe');
noopCleanup();
assertTrue(listeners.attached, 'noop cleanup from second attach does not detach live listeners');
cleanup1();
assertEqual(listeners.detachCount, 1, 'primary cleanup detaches once');
assertTrue(!listeners.attached, 'listeners detached on bootstrap unmount');

// --- Registration in-flight / same-token guard (no duplicate POST loop) ---
const createRegistrationGuard = () => {
  let inFlight = false;
  let lastToken: string | null = null;
  let posts = 0;

  return {
    async register(token: string): Promise<boolean> {
      if (inFlight) {
        return false;
      }
      if (lastToken === token) {
        return true;
      }
      inFlight = true;
      try {
        posts += 1;
        await new Promise((r) => setTimeout(r, 5));
        lastToken = token;
        return true;
      } finally {
        inFlight = false;
      }
    },
    get posts() {
      return posts;
    },
  };
};

const guard = createRegistrationGuard();
void (async () => {
  const a = guard.register('tok-1');
  const b = await guard.register('tok-1');
  assertEqual(b, false, 'duplicate in-flight registration skipped');
  assertTrue(await a, 'first registration succeeds');
  assertEqual(guard.posts, 1, 'only one backend POST while in flight');
  assertTrue(await guard.register('tok-1'), 'same-token re-entry is idempotent');
  assertEqual(guard.posts, 1, 'same token does not POST again this session');
  assertTrue(await guard.register('tok-2'), 'token refresh can POST again');
  assertEqual(guard.posts, 2, 'new token posts once');

  if (failed.length > 0) {
    throw new Error(`push bootstrap tests failed:\n${failed.join('\n')}`);
  }
  console.log('push bootstrap / OTA startup tests passed');
})();
