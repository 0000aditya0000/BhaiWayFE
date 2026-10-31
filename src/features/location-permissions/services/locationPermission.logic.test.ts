import assert from 'node:assert/strict';

import {
  canStartBackgroundTrackingUpdates,
  isConsentRecordValid,
  resolvePermissionLevel,
  resolveTrackingMode,
  shouldDirectToSettings,
  shouldPromptLocationDisclosure,
} from './locationPermission.logic';

const runTests = () => {
  // 1. Consent validation
  assert.equal(
    isConsentRecordValid({
      status: 'consented',
      version: 'v1.0',
      timestampMs: 123456,
      platform: 'android',
    }),
    true,
    'Valid v1.0 consent record should pass',
  );

  assert.equal(
    isConsentRecordValid({
      status: 'declined',
      version: 'v1.0',
      timestampMs: 123456,
      platform: 'android',
    }),
    false,
    'Declined record should be invalid for affirmative consent',
  );

  assert.equal(
    isConsentRecordValid({
      status: 'consented',
      version: 'v0.9',
      timestampMs: 123456,
      platform: 'android',
    }),
    false,
    'Outdated disclosure version should be invalid',
  );

  assert.equal(isConsentRecordValid(null), false, 'Null record should be invalid');

  // 2. Google Play Compliance: Background tracking must NEVER start without affirmative consent
  assert.equal(
    canStartBackgroundTrackingUpdates({
      hasAffirmativeConsent: false,
      backgroundGranted: true,
      servicesEnabled: true,
      rideInProgress: true,
    }),
    false,
    'CRITICAL: Background tracking MUST NOT start without affirmative consent',
  );

  assert.equal(
    canStartBackgroundTrackingUpdates({
      hasAffirmativeConsent: true,
      backgroundGranted: false,
      servicesEnabled: true,
      rideInProgress: true,
    }),
    false,
    'Cannot start background tracking if background permission not granted',
  );

  assert.equal(
    canStartBackgroundTrackingUpdates({
      hasAffirmativeConsent: true,
      backgroundGranted: true,
      servicesEnabled: false,
      rideInProgress: true,
    }),
    false,
    'Cannot start background tracking if location services are disabled',
  );

  assert.equal(
    canStartBackgroundTrackingUpdates({
      hasAffirmativeConsent: true,
      backgroundGranted: true,
      servicesEnabled: true,
      rideInProgress: false,
    }),
    false,
    'Background tracking must NOT start when ride is not in progress',
  );

  assert.equal(
    canStartBackgroundTrackingUpdates({
      hasAffirmativeConsent: true,
      backgroundGranted: true,
      servicesEnabled: true,
      rideInProgress: true,
    }),
    true,
    'Background tracking allowed when all compliance conditions are met',
  );

  // 3. Disclosure prompting
  assert.equal(
    shouldPromptLocationDisclosure({
      hasAffirmativeConsent: false,
      backgroundGranted: false,
      rideInProgress: true,
    }),
    true,
    'Should prompt disclosure when ride is active and consent is missing',
  );

  assert.equal(
    shouldPromptLocationDisclosure({
      hasAffirmativeConsent: true,
      backgroundGranted: true,
      rideInProgress: true,
    }),
    false,
    'Should not prompt disclosure when affirmative consent & permission already granted',
  );

  assert.equal(
    shouldPromptLocationDisclosure({
      hasAffirmativeConsent: false,
      backgroundGranted: false,
      rideInProgress: false,
    }),
    false,
    'Should not prompt disclosure if no ride in progress',
  );

  // 4. Settings guidance
  assert.equal(
    shouldDirectToSettings({
      foregroundGranted: true,
      backgroundGranted: false,
      canAskBackground: false,
      canAskForeground: true,
    }),
    true,
    'Must direct to settings when background permission is blocked from prompt',
  );

  assert.equal(
    shouldDirectToSettings({
      foregroundGranted: true,
      backgroundGranted: true,
      canAskBackground: false,
      canAskForeground: true,
    }),
    false,
    'No settings needed when background is already granted',
  );

  // 5. Fallback tracking modes
  assert.equal(
    resolveTrackingMode({
      foregroundGranted: false,
      backgroundGranted: false,
      hasAffirmativeConsent: false,
    }),
    'none',
  );

  assert.equal(
    resolveTrackingMode({
      foregroundGranted: true,
      backgroundGranted: false,
      hasAffirmativeConsent: false,
    }),
    'foreground_only',
    'Fallback to foreground-only when background denied or unconsented',
  );

  assert.equal(
    resolveTrackingMode({
      foregroundGranted: true,
      backgroundGranted: true,
      hasAffirmativeConsent: true,
    }),
    'full_background',
  );

  // 6. Permission levels
  assert.equal(
    resolvePermissionLevel({
      servicesEnabled: false,
      foregroundGranted: true,
      backgroundGranted: true,
      canAskForeground: true,
      canAskBackground: true,
    }),
    'services_disabled',
  );

  assert.equal(
    resolvePermissionLevel({
      servicesEnabled: true,
      foregroundGranted: true,
      backgroundGranted: true,
      canAskForeground: true,
      canAskBackground: true,
    }),
    'background',
  );

  assert.equal(
    resolvePermissionLevel({
      servicesEnabled: true,
      foregroundGranted: true,
      backgroundGranted: false,
      canAskForeground: true,
      canAskBackground: true,
    }),
    'foreground',
  );

  console.log('locationPermission.logic tests passed');
};

runTests();
