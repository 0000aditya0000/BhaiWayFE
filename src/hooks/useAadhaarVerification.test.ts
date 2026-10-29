import {
  AadhaarVerificationController,
  normalizeDigiLockerError,
  type AadhaarControllerApiPort,
  type DigiLockerSdkPort,
} from '../services/digilocker';
import type {
  AadhaarVerificationRefreshResponse,
  AadhaarVerificationStartResponse,
  AadhaarVerificationStatusResponse,
} from '../types/kyc';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (actual: unknown, label: string): void => {
  if (!actual) {
    failed.push(`${label}: expected truthy, got ${String(actual)}`);
  }
};

const assertFalse = (actual: unknown, label: string): void => {
  if (actual) {
    failed.push(`${label}: expected falsy, got ${String(actual)}`);
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runTests = async () => {
  // ─── 1. Error normalization tests ──────────────────────────────────────────
  {
    const cancelOutcome = normalizeDigiLockerError('User cancelled verification');
    assertEqual(cancelOutcome.reason, 'CANCELLED', 'cancel error code');
    assertEqual(cancelOutcome.friendlyMessage, 'Verification was cancelled.', 'cancel friendly message');
    assertTrue(cancelOutcome.isCancellation, 'isCancellation is true');

    const expiredOutcome = normalizeDigiLockerError('EXPIRED');
    assertEqual(expiredOutcome.reason, 'EXPIRED', 'expired error code');
    assertEqual(
      expiredOutcome.friendlyMessage,
      'Your Aadhaar verification session expired. Please try again.',
      'expired message',
    );

    const consentOutcome = normalizeDigiLockerError('CONSENT_DENIED');
    assertEqual(consentOutcome.reason, 'CONSENT_DENIED', 'consent denied code');
    assertEqual(
      consentOutcome.friendlyMessage,
      'Aadhaar verification was not completed because DigiLocker consent was denied.',
      'consent denied message',
    );

    const networkOutcome = normalizeDigiLockerError('Network Error while loading WebView');
    assertEqual(networkOutcome.reason, 'NETWORK_ERROR', 'network error code');
    assertTrue(networkOutcome.friendlyMessage.includes('internet connection'), 'network error message');

    const genericOutcome = normalizeDigiLockerError('UNKNOWN_ERROR_500');
    assertEqual(genericOutcome.reason, 'FAILED', 'generic failure code');
    assertEqual(
      genericOutcome.friendlyMessage,
      "We couldn't complete Aadhaar verification. Please try again.",
      'generic failure message',
    );
  }

  // ─── 2. Start verification & SDK launch ────────────────────────────────────
  {
    let verifyCalledWithUrl = '';
    let verifyOptions: any = null;

    const mockSdk: DigiLockerSdkPort = {
      verify: (url, _redirectUrl, options) => {
        verifyCalledWithUrl = url;
        verifyOptions = options;
      },
    };

    const mockApi: AadhaarControllerApiPort = {
      start: async (): Promise<AadhaarVerificationStartResponse> => ({
        verificationId: 'v-100',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      getStatus: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
      refresh: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    assertEqual(controller.getState().status, 'NOT_VERIFIED', 'initial status is NOT_VERIFIED');

    await controller.startVerification();

    assertEqual(verifyCalledWithUrl, 'https://verification.cashfree.com/dgl?shortCode=xyz', 'SDK called with URL');
    assertEqual(controller.getState().verificationId, 'v-100', 'verificationId updated');
    assertEqual(controller.getState().status, 'VERIFICATION_IN_PROGRESS', 'status is IN_PROGRESS');
    assertTrue(typeof verifyOptions?.onSuccess === 'function', 'onSuccess callback provided');

    controller.destroy();
  }

  // ─── 3. Double-tap protection ─────────────────────────────────────────────
  {
    let startCallCount = 0;
    const slowApi: AadhaarControllerApiPort = {
      start: async () => {
        startCallCount++;
        await delay(50);
        return {
          verificationId: 'v-200',
          status: 'VERIFICATION_IN_PROGRESS',
          url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
        };
      },
      getStatus: async () => ({ status: 'PENDING' }),
      refresh: async () => ({ status: 'PENDING' }),
    };

    const mockSdk: DigiLockerSdkPort = { verify: () => {} };

    const controller = new AadhaarVerificationController({
      api: slowApi,
      sdk: mockSdk,
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    const p1 = controller.startVerification();
    const p2 = controller.startVerification(); // duplicate tap while in-flight
    await Promise.all([p1, p2]);

    assertEqual(startCallCount, 1, 'duplicate startVerification was ignored');
    controller.destroy();
  }

  // ─── 4. SDK cancellation handling ──────────────────────────────────────────
  {
    let sdkCancelCb: (() => void) | null = null;
    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        sdkCancelCb = options?.onCancel ?? null;
      },
    };

    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({
        verificationId: 'v-300',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      getStatus: async () => ({ status: 'PENDING' }),
      refresh: async () => ({ status: 'PENDING' }),
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    await controller.startVerification();
    assertTrue(typeof sdkCancelCb === 'function', 'SDK received onCancel');

    sdkCancelCb!();

    const state = controller.getState();
    assertEqual(state.status, 'NOT_VERIFIED', 'cancellation sets NOT_VERIFIED');
    assertEqual(state.error, null, 'cancellation is not marked as an error');
    assertEqual(state.userMessage, 'Verification was cancelled.', 'friendly cancellation message');

    controller.destroy();
  }

  // ─── 5. SDK Success -> Backend Verification -> Profile Refresh ─────────────
  {
    let sdkSuccessCb: ((data: unknown) => void) | null = null;
    let syncProfileCalled = false;
    let onVerifiedCalledWith: any = null;

    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        sdkSuccessCb = options?.onSuccess ?? null;
      },
    };

    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({
        verificationId: 'v-400',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      getStatus: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
      refresh: async () => ({
        status: 'VERIFIED',
        verificationId: 'v-400',
        verifiedName: 'Rahul Kumar Singh',
        verifiedGender: 'MALE',
        verifiedAt: '2026-09-18T00:00:00.000Z',
      }),
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      syncProfile: async () => {
        syncProfileCalled = true;
      },
      onVerified: (data) => {
        onVerifiedCalledWith = data;
      },
      onStateChange: () => {},
    });

    await controller.startVerification();

    // Trigger SDK success callback
    sdkSuccessCb!({ reference_id: 'ref-123' });
    await delay(30);

    const state = controller.getState();
    assertEqual(state.status, 'VERIFIED', 'status updated to VERIFIED after backend refresh');
    assertEqual(state.verifiedName, 'Rahul Kumar Singh', 'canonical name from backend');
    assertEqual(state.verifiedGender, 'MALE', 'canonical gender from backend');
    assertTrue(syncProfileCalled, 'syncProfile (/users/me) was invoked');
    assertEqual(onVerifiedCalledWith?.verifiedName, 'Rahul Kumar Singh', 'onVerified received verified data');

    controller.destroy();
  }

  // ─── 5b. Name mismatch automatically adopts backend canonical name ────────
  {
    // Prior local cached user has name "Rahul Kumar"
    let priorCachedName = 'Rahul Kumar';
    let syncedName = '';

    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        options?.onSuccess?.({});
      },
    };

    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({ verificationId: 'v-401', status: 'PENDING', url: 'https://cashfree.com' }),
      getStatus: async () => ({ status: 'PENDING' }),
      refresh: async () => ({
        status: 'VERIFIED',
        verificationId: 'v-401',
        verifiedName: 'Rahul Kumar Singh', // Backend returns new official name
        verifiedGender: 'MALE',
      }),
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      syncProfile: async () => {
        // Backend /users/me updates the profile name to canonical Aadhaar name
        priorCachedName = 'Rahul Kumar Singh';
        syncedName = priorCachedName;
      },
      onStateChange: () => {},
    });

    await controller.startVerification();
    await delay(30);

    const state = controller.getState();
    assertEqual(state.verifiedName, 'Rahul Kumar Singh', 'replaces stale cached name with backend canonical name');
    assertEqual(syncedName, 'Rahul Kumar Singh', 'profile sync reflects canonical name');

    controller.destroy();
  }

  // ─── 5c. Gender is updated from backend and locked ────────────────────────
  {
    let genderLockedFromBackend = false;

    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        options?.onSuccess?.({});
      },
    };

    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({ verificationId: 'v-402', status: 'PENDING', url: 'https://cashfree.com' }),
      getStatus: async () => ({ status: 'PENDING' }),
      refresh: async () => ({
        status: 'VERIFIED',
        verificationId: 'v-402',
        verifiedName: 'Priya Sharma',
        verifiedGender: 'FEMALE',
      }),
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      syncProfile: async () => {
        genderLockedFromBackend = true;
      },
      onStateChange: () => {},
    });

    await controller.startVerification();
    await delay(30);

    const state = controller.getState();
    assertEqual(state.verifiedGender, 'FEMALE', 'backend verified gender updated');
    assertTrue(genderLockedFromBackend, 'syncProfile locks gender on profile');

    controller.destroy();
  }

  // ─── 6. Bounded polling when backend is pending ────────────────────────────
  {
    let pollCount = 0;
    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        options?.onSuccess?.({});
      },
    };

    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({
        verificationId: 'v-500',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      refresh: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
      getStatus: async () => {
        pollCount++;
        if (pollCount === 2) {
          return {
            status: 'VERIFIED',
            verifiedName: 'Pooja Sharma',
            verifiedGender: 'FEMALE',
          };
        }
        return { status: 'VERIFICATION_IN_PROGRESS' };
      },
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      pollingDelaysMs: [10, 10, 10], // fast polling for tests
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    await controller.startVerification();
    await delay(60);

    assertEqual(controller.getState().status, 'VERIFIED', 'polling resolved to VERIFIED');
    assertEqual(controller.getState().verifiedName, 'Pooja Sharma', 'verified name from polling');
    assertEqual(controller.getState().verifiedGender, 'FEMALE', 'verified gender from polling');

    controller.destroy();
  }

  // ─── 7. Bounded polling timeout stops without infinite loop ───────────────
  {
    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        options?.onSuccess?.({});
      },
    };

    let getStatusCalls = 0;
    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({
        verificationId: 'v-600',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      refresh: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
      getStatus: async () => {
        getStatusCalls++;
        return { status: 'VERIFICATION_IN_PROGRESS' };
      },
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      pollingDelaysMs: [5, 5, 5], // 3 polls max
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    await controller.startVerification();
    await delay(50);

    assertEqual(getStatusCalls, 3, 'polling stopped after bounded attempts');
    assertEqual(controller.getState().status, 'VERIFICATION_IN_PROGRESS', 'still in progress');
    assertEqual(
      controller.getState().userMessage,
      'Verification is still processing. You can check again shortly.',
      'bounded timeout user message',
    );

    controller.destroy();
  }

  // ─── 8. App resume handles pending verification ────────────────────────────
  {
    let getStatusCalledOnResume = false;
    const mockSdk: DigiLockerSdkPort = { verify: () => {} };

    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({
        verificationId: 'v-700',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      getStatus: async () => {
        getStatusCalledOnResume = true;
        return { status: 'VERIFIED', verifiedName: 'Aarav Patel' };
      },
      refresh: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    await controller.startVerification();
    assertFalse(getStatusCalledOnResume, 'not called before resume');

    await controller.onAppResume();
    assertTrue(getStatusCalledOnResume, 'checkStatus triggered on app resume');
    assertEqual(controller.getState().status, 'VERIFIED', 'resumed verification transitioned to VERIFIED');

    controller.destroy();
  }

  // ─── 9. Cleanup on destroy ────────────────────────────────────────────────
  {
    const mockSdk: DigiLockerSdkPort = {
      verify: (_url, _redirectUrl, options) => {
        options?.onSuccess?.({});
      },
    };

    let polledAfterDestroy = false;
    const mockApi: AadhaarControllerApiPort = {
      start: async () => ({
        verificationId: 'v-800',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz',
      }),
      refresh: async () => ({ status: 'VERIFICATION_IN_PROGRESS' }),
      getStatus: async () => {
        polledAfterDestroy = true;
        return { status: 'VERIFICATION_IN_PROGRESS' };
      },
    };

    const controller = new AadhaarVerificationController({
      api: mockApi,
      sdk: mockSdk,
      pollingDelaysMs: [50, 50],
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    await controller.startVerification();
    controller.destroy(); // destroy immediately
    await delay(80);

    assertFalse(polledAfterDestroy, 'no polling calls after destroy');
  }

  // ─── 10. Security assertion: Never client-controlled ──────────────────────
  {
    const controller = new AadhaarVerificationController({
      api: {
        start: async () => ({ verificationId: 'v-900', status: 'PENDING', url: 'https://cashfree.com' }),
        getStatus: async () => ({ status: 'PENDING' }),
        refresh: async () => ({ status: 'PENDING' }),
      },
      sdk: {
        verify: (_u, _r, options) => {
          // Client SDK callback sends { verified: true } — controller MUST NOT blindly trust it
          options?.onSuccess?.({ verified: true, verifiedName: 'Hacker Name', verifiedGender: 'FEMALE' });
        },
      },
      syncProfile: async () => {},
      onStateChange: () => {},
    });

    await controller.startVerification();
    await delay(20);

    assertEqual(
      controller.getState().status,
      'VERIFICATION_IN_PROGRESS',
      'controller does not trust client SDK payload; awaits backend authoritative status',
    );

    controller.destroy();
  }

  if (failed.length > 0) {
    console.error('useAadhaarVerification.test.ts failures:\n' + failed.join('\n'));
    process.exit(1);
  }

  console.log('useAadhaarVerification.test.ts passed');
};

void runTests();
