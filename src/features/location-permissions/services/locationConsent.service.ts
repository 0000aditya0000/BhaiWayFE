import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CURRENT_DISCLOSURE_VERSION,
  LOCATION_DISCLOSURE_STORAGE_KEY,
} from '../config/locationDisclosure.constants';
import type {
  LocationConsentStatus,
  LocationDisclosureRecord,
} from '../types/locationPermission.types';

let memoryCache: LocationDisclosureRecord | null = null;

export const locationConsentService = {
  async getConsentRecord(): Promise<LocationDisclosureRecord | null> {
    if (memoryCache) {
      return memoryCache;
    }
    try {
      const raw = await AsyncStorage.getItem(LOCATION_DISCLOSURE_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as LocationDisclosureRecord;
      if (parsed && typeof parsed === 'object' && parsed.status && parsed.version) {
        memoryCache = parsed;
        return parsed;
      }
      return null;
    } catch {
      return memoryCache;
    }
  },

  async hasAffirmativeConsent(): Promise<boolean> {
    const record = await this.getConsentRecord();
    if (!record) {
      return false;
    }
    return (
      record.status === 'consented' &&
      record.version === CURRENT_DISCLOSURE_VERSION
    );
  },

  async getConsentStatus(): Promise<LocationConsentStatus> {
    const record = await this.getConsentRecord();
    if (!record || record.version !== CURRENT_DISCLOSURE_VERSION) {
      return 'not_prompted';
    }
    return record.status;
  },

  async recordConsent(status: 'consented' | 'declined'): Promise<LocationDisclosureRecord> {
    const record: LocationDisclosureRecord = {
      status,
      version: CURRENT_DISCLOSURE_VERSION,
      timestampMs: Date.now(),
      platform: Platform.OS,
    };
    memoryCache = record;
    try {
      await AsyncStorage.setItem(
        LOCATION_DISCLOSURE_STORAGE_KEY,
        JSON.stringify(record),
      );
    } catch {
      // Memory fallback remains active
    }
    return record;
  },

  async resetConsent(): Promise<void> {
    memoryCache = null;
    try {
      await AsyncStorage.removeItem(LOCATION_DISCLOSURE_STORAGE_KEY);
    } catch {
      // Memory fallback
    }
  },

  _resetMemoryCache(): void {
    memoryCache = null;
  },
};
