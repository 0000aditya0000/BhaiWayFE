import { unwrapSosEvent, unwrapSosRecord, isActiveSosStatus } from './sos.unwrap';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertNull = (value: unknown, label: string): void => {
  if (value !== null) {
    failed.push(`${label}: expected null, got ${JSON.stringify(value)}`);
  }
};

assertNull(unwrapSosRecord(null), 'null payload');
assertNull(unwrapSosRecord({ id: 'sos-1' }), 'missing rideId');

const created = unwrapSosRecord({
  data: {
    id: 'sos-1',
    rideId: 'ride-9',
    status: 'ACTIVE',
    category: 'EMERGENCY',
    triggeredAt: '2026-10-30T10:00:00.000Z',
    attachedToExisting: false,
    triggerer: { userId: 'u-1', name: 'Asha' },
    latitude: 28.61,
    longitude: 77.21,
  },
});
assertEqual(created?.id, 'sos-1', 'unwrap id');
assertEqual(created?.rideId, 'ride-9', 'unwrap rideId');
assertEqual(created?.triggerer?.name, 'Asha', 'unwrap triggerer name');
assertEqual(created?.attachedToExisting, false, 'unwrap attached false');

const attached = unwrapSosRecord({
  sosId: 'sos-1',
  ride_id: 'ride-9',
  attachedToExisting: true,
  passengerName: 'Ravi',
});
assertEqual(attached?.id, 'sos-1', 'sosId alias');
assertEqual(attached?.attachedToExisting, true, 'attached true');
assertEqual(attached?.triggerer?.name, 'Ravi', 'passengerName alias');

const resolved = unwrapSosEvent('sos:resolved', {
  id: 'sos-1',
  rideId: 'ride-9',
  status: 'ACTIVE',
});
assertEqual(resolved?.status, 'RESOLVED', 'resolved event overrides status');

const extra = unwrapSosEvent('sos:additional-trigger', {
  id: 'sos-1',
  rideId: 'ride-9',
  status: 'ACTIVE',
});
assertTrue(Boolean(extra?.attachedToExisting), 'additional trigger marks attached');

assertTrue(isActiveSosStatus('ACTIVE'), 'ACTIVE is live');
assertTrue(isActiveSosStatus('ACKNOWLEDGED'), 'ACKNOWLEDGED is live');
assertTrue(!isActiveSosStatus('RESOLVED'), 'RESOLVED is not live');

if (failed.length > 0) {
  throw new Error(`sos.unwrap tests failed:\n${failed.join('\n')}`);
}
console.log('sos.unwrap tests passed');
