import {
  canTrackWithoutAlwaysPermission,
  haversineMeters,
  isEligibleTrackingStatus,
  isNewerLocationTimestamp,
  isValidPublishCoordinate,
  mapDriverPermissionMessage,
  pickEligibleDriverRideId,
  returningToLiveRideShouldCreateWatcher,
  screenUnmountShouldStopTracking,
  shouldKeepTrackingOnBackground,
  shouldPublishSample,
  shouldReconcileOnAppState,
  shouldRetryBufferedSample,
  shouldStartNativeLocationUpdates,
  shouldStopForRideStatus,
  type LocationSample,
} from './driverLocationPublisher.logic';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

const sample = (overrides: Partial<LocationSample> = {}): LocationSample => ({
  latitude: 12.9716,
  longitude: 77.5946,
  heading: 90,
  speed: 5,
  timestampMs: 1_700_000_000_000,
  ...overrides,
});

assertTrue(isEligibleTrackingStatus('IN_PROGRESS'), 'eligible IN_PROGRESS starts tracking');
assertTrue(isEligibleTrackingStatus('in_progress'), 'status compare is case-insensitive');
assertFalse(isEligibleTrackingStatus('PUBLISHED'), 'published ride does not start tracking');
assertTrue(shouldStopForRideStatus('COMPLETED'), 'completed trip stops tracking');
assertTrue(shouldStopForRideStatus('CANCELLED'), 'cancelled trip stops tracking');
assertFalse(shouldStopForRideStatus('IN_PROGRESS'), 'in-progress does not stop');

assertFalse(screenUnmountShouldStopTracking(), 'leaving Live Ride does not stop GPS');
assertFalse(
  returningToLiveRideShouldCreateWatcher(),
  'returning to Live Ride does not create a second watcher',
);

assertTrue(shouldReconcileOnAppState('active'), 'resume reconciles tracking');
assertFalse(shouldReconcileOnAppState('background'), 'background does not reconcile');
assertTrue(shouldKeepTrackingOnBackground('background'), 'background keeps tracking session');
assertTrue(shouldKeepTrackingOnBackground('inactive'), 'inactive keeps tracking session');

assertEqual(
  pickEligibleDriverRideId([
    { id: 'r1', status: 'PUBLISHED' },
    { id: 'r2', status: 'IN_PROGRESS' },
    { id: 'r3', status: 'COMPLETED' },
  ]),
  'r2',
  'picks authorized IN_PROGRESS ride only',
);
assertEqual(
  pickEligibleDriverRideId([{ id: 'stale', status: 'COMPLETED' }]),
  null,
  'does not restart from completed local/backend state',
);

assertTrue(isValidPublishCoordinate({ latitude: 12.9, longitude: 77.6 }), 'plausible coord');
assertFalse(isValidPublishCoordinate({ latitude: 0, longitude: 0 }), '0,0 is invalid');
assertFalse(isValidPublishCoordinate({ latitude: 91, longitude: 0 }), 'out of range lat');

const origin = sample();
assertTrue(
  shouldPublishSample({
    kind: 'socket',
    nowMs: origin.timestampMs,
    sample: origin,
    last: { at: 0, coordinate: null },
  }),
  'first socket sample always publishes',
);
assertFalse(
  shouldPublishSample({
    kind: 'socket',
    nowMs: origin.timestampMs + 400,
    sample: origin,
    last: { at: origin.timestampMs, coordinate: origin },
  }),
  'socket rate-limits near-duplicate samples',
);
assertTrue(
  shouldPublishSample({
    kind: 'socket',
    nowMs: origin.timestampMs + 2600,
    sample: origin,
    last: { at: origin.timestampMs, coordinate: origin },
  }),
  'socket publishes after min interval',
);

const moved = sample({ latitude: 12.9724, longitude: 77.5946 });
assertTrue(
  haversineMeters(origin, moved) >= 8,
  'moved sample is far enough for socket min meters',
);
assertTrue(
  shouldPublishSample({
    kind: 'socket',
    nowMs: origin.timestampMs + 200,
    sample: moved,
    last: { at: origin.timestampMs, coordinate: origin },
  }),
  'socket publishes when the driver moved enough',
);

assertTrue(
  shouldRetryBufferedSample({
    sampleTimestampMs: 1_000,
    nowMs: 1_000 + 8_000,
  }),
  'fresh buffered sample may retry after disconnect',
);
assertFalse(
  shouldRetryBufferedSample({
    sampleTimestampMs: 1_000,
    nowMs: 1_000 + 30_000,
  }),
  'stale buffered coordinates are not posted as current',
);

assertTrue(
  isNewerLocationTimestamp('2026-10-28T10:00:05.000Z', '2026-10-28T10:00:00.000Z'),
  'newer timestamp wins',
);
assertFalse(
  isNewerLocationTimestamp('2026-10-28T10:00:00.000Z', '2026-10-28T10:00:05.000Z'),
  'older location event does not overwrite newer',
);
assertFalse(
  isNewerLocationTimestamp(undefined, '2026-10-28T10:00:05.000Z'),
  'unstamped event does not overwrite a stamped coordinate',
);

assertTrue(
  shouldStartNativeLocationUpdates({ platform: 'android', foregroundGranted: true }),
  'android starts native updates with foreground permission',
);
assertFalse(
  shouldStartNativeLocationUpdates({ platform: 'web', foregroundGranted: true }),
  'web does not start native background updates',
);
assertTrue(
  canTrackWithoutAlwaysPermission(true),
  'in-app tracking continues with when-in-use only',
);

assertTrue(
  Boolean(mapDriverPermissionMessage('denied')),
  'permission denial has driver-facing copy',
);
assertTrue(
  Boolean(mapDriverPermissionMessage('services_off')),
  'disabled GPS has driver-facing copy',
);

if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('driverLocationPublisher.logic tests passed');
