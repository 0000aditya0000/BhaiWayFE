import { resolveTrackingEventRideId, shouldIgnoreLocationEvent } from './trackingSocket.logic';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
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
  resolveTrackingEventRideId('ride-a', 'ride-a'),
  'ride-a',
  'payload ride id is preferred',
);
assertEqual(
  resolveTrackingEventRideId('', 'ride-joined'),
  'ride-joined',
  'missing payload ride id uses the joined room',
);
assertEqual(resolveTrackingEventRideId(null, null), '', 'empty when both missing');

assertFalse(
  shouldIgnoreLocationEvent({ payloadRideId: 'ride-a', joinedRideId: 'ride-a' }),
  'matching ride id is applied',
);
assertTrue(
  shouldIgnoreLocationEvent({ payloadRideId: 'ride-b', joinedRideId: 'ride-a' }),
  'incorrect ride id events are ignored',
);
assertFalse(
  shouldIgnoreLocationEvent({ payloadRideId: 'ride-a', joinedRideId: null }),
  'event is kept when no joined filter is set',
);

if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('trackingSocket.logic tests passed');
