import { sosStore } from './sos.store';
import type { SosRecord } from '../api/sos.types';

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

const record = (overrides?: Partial<SosRecord>): SosRecord => ({
  id: 'sos-1',
  rideId: 'ride-1',
  status: 'ACTIVE',
  category: 'EMERGENCY',
  triggeredAt: '2026-10-30T10:00:00.000Z',
  triggerer: { userId: 'p-1', name: 'Asha' },
  attachedToExisting: false,
  latitude: 28.61,
  longitude: 77.21,
  ...overrides,
});

sosStore.reset();
sosStore.applyRecord(record());
assertEqual(sosStore.get().sosId, 'sos-1', 'stores sos id');
assertEqual(sosStore.get().rideId, 'ride-1', 'stores ride id');

sosStore.applyRecord(record({ rideId: 'ride-2', id: 'sos-2' }));
assertEqual(sosStore.get().sosId, 'sos-1', 'does not overwrite with another ride SOS');

sosStore.applyRecord(record({ attachedToExisting: true, triggerer: { userId: 'p-2', name: 'Ravi' } }));
assertTrue(sosStore.get().attachedToExisting, 'additional trigger stays on original SOS');
assertEqual(sosStore.get().sosId, 'sos-1', 'original SOS id preserved');
assertEqual(sosStore.get().triggererName, 'Asha', 'original triggerer is preserved');

sosStore.presentDriverAlert('sos-1');
assertTrue(sosStore.get().driverAlertVisible, 'driver popup visible');
sosStore.dismissDriverAlert('sos-1');
assertTrue(!sosStore.get().driverAlertVisible, 'local dismiss hides popup');
assertEqual(sosStore.get().sosId, 'sos-1', 'local dismiss does not clear backend SOS');

sosStore.applyRecord(record({ status: 'RESOLVED' }));
assertEqual(sosStore.get().sosId, null, 'resolved SOS clears active UI state');

if (failed.length > 0) {
  throw new Error(`sos.store tests failed:\n${failed.join('\n')}`);
}
console.log('sos.store tests passed');
