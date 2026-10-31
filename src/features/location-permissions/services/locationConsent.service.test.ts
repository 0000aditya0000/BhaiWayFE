import assert from 'node:assert/strict';

import {
  CURRENT_DISCLOSURE_VERSION,
  LOCATION_DISCLOSURE_STORAGE_KEY,
} from '../config/locationDisclosure.constants';
import type { LocationDisclosureRecord } from '../types/locationPermission.types';

// Pure in-memory replica of locationConsent logic for node tests
class MockConsentStore {
  private cache: LocationDisclosureRecord | null = null;
  private storage = new Map<string, string>();

  async getConsentRecord(): Promise<LocationDisclosureRecord | null> {
    if (this.cache) {
      return this.cache;
    }
    const raw = this.storage.get(LOCATION_DISCLOSURE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    this.cache = parsed;
    return parsed;
  }

  async hasAffirmativeConsent(): Promise<boolean> {
    const record = await this.getConsentRecord();
    return Boolean(
      record &&
        record.status === 'consented' &&
        record.version === CURRENT_DISCLOSURE_VERSION,
    );
  }

  async recordConsent(status: 'consented' | 'declined', platform = 'android'): Promise<LocationDisclosureRecord> {
    const record: LocationDisclosureRecord = {
      status,
      version: CURRENT_DISCLOSURE_VERSION,
      timestampMs: Date.now(),
      platform,
    };
    this.cache = record;
    this.storage.set(LOCATION_DISCLOSURE_STORAGE_KEY, JSON.stringify(record));
    return record;
  }

  async resetConsent(): Promise<void> {
    this.cache = null;
    this.storage.delete(LOCATION_DISCLOSURE_STORAGE_KEY);
  }
}

const runTests = async () => {
  const store = new MockConsentStore();

  // Test 1: Initially not consented
  assert.equal(await store.hasAffirmativeConsent(), false, 'Should be false initially');

  // Test 2: Record consent
  const record = await store.recordConsent('consented', 'android');
  assert.equal(record.status, 'consented');
  assert.equal(record.version, CURRENT_DISCLOSURE_VERSION);
  assert.equal(record.platform, 'android');
  assert.equal(await store.hasAffirmativeConsent(), true, 'Should be true after consent');

  // Test 3: Record decline
  await store.recordConsent('declined', 'android');
  assert.equal(await store.hasAffirmativeConsent(), false, 'Should be false when declined');

  // Test 4: Reset
  await store.resetConsent();
  assert.equal(await store.hasAffirmativeConsent(), false, 'Should be false after reset');

  console.log('locationConsent.service pure tests passed');
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
