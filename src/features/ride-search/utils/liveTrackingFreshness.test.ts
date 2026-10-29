import {
  classifyRiderLocationFreshness,
  formatLastLocationReceivedAt,
  isNewerLocationTimestamp,
  RIDER_LOCATION_STALE_MS,
} from './liveTrackingFreshness';

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

assertEqual(
  classifyRiderLocationFreshness({
    rideStarted: true,
    hasCoordinate: false,
    updatedAt: null,
    nowMs: 1_000,
  }),
  'WAITING',
  'no initial driver location is WAITING, not stale',
);

assertEqual(
  classifyRiderLocationFreshness({
    rideStarted: true,
    hasCoordinate: false,
    updatedAt: null,
    nowMs: 1_000,
    trackingError: 'Connection issue',
  }),
  'UNAVAILABLE',
  'no pin plus tracking error is temporarily unavailable',
);

assertEqual(
  classifyRiderLocationFreshness({
    rideStarted: true,
    hasCoordinate: true,
    updatedAt: new Date(50_000).toISOString(),
    nowMs: 50_000 + 10_000,
  }),
  'LIVE',
  'fresh update is LIVE',
);

assertEqual(
  classifyRiderLocationFreshness({
    rideStarted: true,
    hasCoordinate: true,
    updatedAt: new Date(50_000).toISOString(),
    nowMs: 50_000 + RIDER_LOCATION_STALE_MS + 1,
  }),
  'STALE',
  'last pin older than backend interval is STALE',
);

assertTrue(
  isNewerLocationTimestamp('2026-10-28T12:00:10.000Z', '2026-10-28T12:00:00.000Z'),
  'rider applies newer socket/REST coordinate',
);
assertFalse(
  isNewerLocationTimestamp('2026-10-28T12:00:00.000Z', '2026-10-28T12:00:10.000Z'),
  'older rider event does not overwrite newer marker',
);

const labeled = formatLastLocationReceivedAt(new Date(2026, 9, 28, 15, 42, 0).toISOString());
assertTrue(Boolean(labeled && labeled.includes('3:42')), 'stale copy includes clock time');
assertTrue(Boolean(labeled && labeled.startsWith('Last location received at')), 'stale prefix');

if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('liveTrackingFreshness tests passed');
