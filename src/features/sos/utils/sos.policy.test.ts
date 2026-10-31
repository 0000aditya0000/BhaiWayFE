import {
  shouldNotifyCoPassenger,
  shouldPlayEmergencySound,
  shouldPresentDriverAlert,
  isTerminalSosStatus,
} from './sos.policy';
import {
  clearSosIdempotencyKey,
  getOrCreateSosIdempotencyKey,
  peekSosIdempotencyKey,
  resetSosIdempotencyKeys,
} from './sos.idempotency';
import { isSosAlreadyActiveError, mapSosTriggerError, SOS_ERROR_MESSAGES } from './sos.errors';

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

assertTrue(
  shouldPresentDriverAlert({ sosId: 'sos-1', source: 'socket', seenAlertSosIds: [] }),
  'new socket alert is shown',
);
assertTrue(
  !shouldPresentDriverAlert({ sosId: 'sos-1', source: 'rest', seenAlertSosIds: [] }),
  'REST recovery does not replay popup',
);
assertTrue(
  !shouldPresentDriverAlert({
    sosId: 'sos-1',
    source: 'socket',
    seenAlertSosIds: ['sos-1'],
  }),
  'duplicate socket event does not replay popup',
);
assertTrue(
  !shouldPlayEmergencySound({
    sosId: 'sos-1',
    source: 'socket',
    seenSoundSosIds: ['sos-1'],
  }),
  'duplicate socket event does not restart sound',
);

assertTrue(
  shouldNotifyCoPassenger({
    sosId: 'sos-1',
    currentUserTriggered: false,
    currentUserId: 'p-2',
    triggererUserId: 'p-1',
    seenPassengerAlertSosIds: [],
  }),
  'other passenger is notified',
);
assertTrue(
  !shouldNotifyCoPassenger({
    sosId: 'sos-1',
    currentUserTriggered: true,
    currentUserId: 'p-1',
    triggererUserId: 'p-1',
    seenPassengerAlertSosIds: [],
  }),
  'triggering passenger is not notified as co-passenger',
);
assertTrue(
  !shouldNotifyCoPassenger({
    sosId: 'sos-1',
    currentUserTriggered: false,
    currentUserId: 'p-1',
    triggererUserId: 'p-1',
    seenPassengerAlertSosIds: [],
  }),
  'matching user id excludes triggerer',
);

assertTrue(isTerminalSosStatus('RESOLVED'), 'resolved is terminal');
assertTrue(isTerminalSosStatus('FALSE_ALARM'), 'false alarm is terminal');
assertTrue(!isTerminalSosStatus('ACTIVE'), 'active is not terminal');

resetSosIdempotencyKeys();
const first = getOrCreateSosIdempotencyKey('ride-1');
const retry = getOrCreateSosIdempotencyKey('ride-1');
assertEqual(retry, first, 'retry reuses the same SOS idempotency key');
assertEqual(peekSosIdempotencyKey('ride-1'), first, 'pending key remains until cleared');
clearSosIdempotencyKey('ride-1');
const nextAttempt = getOrCreateSosIdempotencyKey('ride-1');
assertTrue(nextAttempt !== first, 'new attempt after success gets a new key');

assertTrue(isSosAlreadyActiveError({ status: 409, code: 'SOS_ACTIVE', message: 'already' }), '409 is already-active');
assertEqual(mapSosTriggerError({ status: 401, code: 'HTTP_401', message: 'no' }), SOS_ERROR_MESSAGES.UNAUTHORIZED, '401 maps');
assertEqual(mapSosTriggerError({ status: 0, code: 'NETWORK_ERROR', message: 'offline' }), SOS_ERROR_MESSAGES.NETWORK, 'network maps');
assertEqual(mapSosTriggerError({ status: 404, code: 'HTTP_404', message: 'Ride is no longer active' }), SOS_ERROR_MESSAGES.RIDE_INACTIVE, 'inactive ride maps');

if (failed.length > 0) {
  throw new Error(`sos.policy tests failed:\n${failed.join('\n')}`);
}
console.log('sos.policy tests passed');
