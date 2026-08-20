import { ENDPOINTS } from '../../../network/endpoints';

import { verificationStore } from '../store/verificationStore';
import {
  assertClientControlledVerificationPayload,
  buildIdentitySubmitPayload,
  isIdentityFailedStatus,
  isIdentityPendingStatus,
  isIdentityVerifiedStatus,
  mapIdentityVerificationError,
  resolveIdentityOutcomeMessage,
} from './verification.mapper';

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

const assertThrows = (fn: () => void, label: string): void => {
  try {
    fn();
    failed.push(`${label}: expected throw`);
  } catch {
    // expected
  }
};

assertEqual(ENDPOINTS.verification.me, '/verification/me', 'GET /verification/me endpoint');
assertEqual(ENDPOINTS.verification.identity, '/verification/identity', 'POST /verification/identity endpoint');

// 1. GET /verification/me — no verification yet (PENDING)
verificationStore.clear();
assertFalse(verificationStore.isIdentityVerified(), 'no verification: not verified');
assertEqual(verificationStore.getIdentityStatus(), null, 'no verification: null status');

verificationStore.set({
  identity: { status: 'PENDING' },
  drivingLicense: { status: 'PENDING' },
  vehicle: { status: 'PENDING' },
});
assertFalse(verificationStore.isIdentityVerified(), 'PENDING identity: not verified');
assertEqual(verificationStore.getIdentityStatus(), 'PENDING', 'PENDING identity status');

// 2. GET /verification/me — VERIFIED
verificationStore.set({
  identity: { status: 'VERIFIED', verifiedAt: '2026-01-01T00:00:00.000Z' },
  drivingLicense: { status: 'PENDING' },
  vehicle: { status: 'PENDING' },
});
assertTrue(verificationStore.isIdentityVerified(), 'VERIFIED identity: verified badge');

// 3. POST /verification/identity payload through stub-compatible contract
const payload = buildIdentitySubmitPayload({
  frontSecureUrl: 'https://cdn.example.com/aadhaar-front.jpg',
  backSecureUrl: null,
  frontPublicId: 'aadhaar/front-id',
  backPublicId: null,
});
assertEqual(payload?.documentUrl, 'https://cdn.example.com/aadhaar-front.jpg', 'documentUrl from front');
assertEqual(payload?.documentType, 'IDENTITY_SCAN', 'documentType identity scan');
assertEqual(payload?.documentReference, 'aadhaar/front-id', 'documentReference from public id');
assertEqual('verified' in payload, false, 'payload must not include verified');
assertEqual('status' in payload, false, 'payload must not include status');

const payloadWithoutDocument = buildIdentitySubmitPayload({
  frontSecureUrl: null,
  backSecureUrl: null,
  frontPublicId: null,
  backPublicId: null,
});
assertEqual(payloadWithoutDocument.documentType, 'IDENTITY_SCAN', 'aadhaar-only flow sends documentType');
assertEqual('documentUrl' in payloadWithoutDocument, false, 'aadhaar-only flow omits documentUrl');

assertThrows(
  () =>
    assertClientControlledVerificationPayload({
      documentUrl: 'https://cdn.example.com/doc.jpg',
      verified: true,
    } as never),
  'client-controlled verified field rejected',
);

// 4. Successful backend response → VERIFIED
assertTrue(isIdentityVerifiedStatus('VERIFIED'), 'VERIFIED status helper');
assertEqual(
  resolveIdentityOutcomeMessage({ status: 'VERIFIED' }).kind,
  'verified',
  'VERIFIED outcome kind',
);

// 5. FAILED response
assertTrue(isIdentityFailedStatus('REJECTED'), 'REJECTED is failed');
assertTrue(isIdentityFailedStatus('EXPIRED'), 'EXPIRED is failed');
assertEqual(
  resolveIdentityOutcomeMessage({
    status: 'REJECTED',
    rejectionReason: 'Document unreadable',
  }).kind,
  'failed',
  'REJECTED outcome kind',
);
assertEqual(
  resolveIdentityOutcomeMessage({
    status: 'REJECTED',
    rejectionReason: 'Document unreadable',
  }).message,
  'Document unreadable',
  'REJECTED uses backend reason',
);

// 6. PENDING / IN_REVIEW
assertTrue(isIdentityPendingStatus('PENDING'), 'PENDING is pending');
assertTrue(isIdentityPendingStatus('IN_REVIEW'), 'IN_REVIEW is pending');
assertEqual(
  resolveIdentityOutcomeMessage({ status: 'IN_REVIEW' }).kind,
  'pending',
  'IN_REVIEW outcome kind',
);

// 7–8. No MSG91 or auth verify in identity payload / endpoints
const payloadJson = JSON.stringify(payload);
assertFalse(payloadJson.includes('msg91'), 'no MSG91 in identity payload');
assertFalse(payloadJson.includes('/auth/msg91/verify'), 'no auth verify in identity payload');
assertFalse(ENDPOINTS.verification.identity.includes('msg91'), 'identity endpoint is not MSG91');

// 9. Verification status is not client-controlled
assertEqual(buildIdentitySubmitPayload({
  frontSecureUrl: 'https://cdn.example.com/a.jpg',
  backSecureUrl: null,
  frontPublicId: null,
  backPublicId: null,
})?.documentType, 'IDENTITY_SCAN', 'only document metadata sent');

// 10. Profile verification status updates after successful verification
let profileBadgeVerified = verificationStore.isIdentityVerified();
verificationStore.subscribe((state) => {
  profileBadgeVerified = state?.identity.status === 'VERIFIED';
});
verificationStore.set({
  identity: { status: 'PENDING' },
  drivingLicense: { status: 'PENDING' },
  vehicle: { status: 'PENDING' },
});
assertFalse(profileBadgeVerified, 'profile badge false while pending');
verificationStore.set({
  identity: { status: 'VERIFIED' },
  drivingLicense: { status: 'PENDING' },
  vehicle: { status: 'PENDING' },
});
assertTrue(profileBadgeVerified, 'profile badge true after VERIFIED');

assertEqual(
  mapIdentityVerificationError({ status: 409, message: 'Active verification exists' }),
  'An identity verification is already in progress or completed.',
  '409 mapped message',
);
assertEqual(
  mapIdentityVerificationError({ status: 401, message: 'Unauthorized' }),
  'Your session expired. Please sign in again.',
  '401 mapped message',
);
assertEqual(
  mapIdentityVerificationError({ status: 400, message: 'documentUrl must be a URL' }),
  'documentUrl must be a URL',
  '400 mapped message',
);

if (failed.length > 0) {
  throw new Error(`verification.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('verification.mapper tests passed');
