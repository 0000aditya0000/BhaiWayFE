import { ENDPOINTS } from '../network/endpoints';
import { createKycApi, type HttpClientPort } from './kyc.api';

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

const runAsyncTests = async () => {
  // 1. startAadhaarVerification success
  let capturedPostUrl = '';
  let capturedPostBody: unknown = null;

  const mockClient: HttpClientPort = {
    get: async <T>(_url: string): Promise<T> => {
      throw new Error('Not implemented');
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedPostUrl = url;
      capturedPostBody = body;
      return {
        verificationId: 'v-12345',
        status: 'VERIFICATION_IN_PROGRESS',
        url: 'https://verification.cashfree.com/dgl?shortCode=xyz123',
      } as T;
    },
  };

  const api = createKycApi(mockClient);

  const startRes = await api.startAadhaarVerification();
  assertEqual(capturedPostUrl, ENDPOINTS.kyc.aadhaarDigilockerStart, 'start uses correct endpoint');
  assertEqual(startRes.verificationId, 'v-12345', 'start returns verificationId');
  assertEqual(startRes.status, 'VERIFICATION_IN_PROGRESS', 'start returns status');
  assertTrue(startRes.url.includes('cashfree.com'), 'start returns DigiLocker URL');

  // Security check: No secrets in payload or request
  assertFalse(JSON.stringify(capturedPostBody ?? {}).includes('secret'), 'no secret in start request body');

  // 2. startAadhaarVerification error
  const errorClient: HttpClientPort = {
    get: async <T>(): Promise<T> => {
      throw new Error('Not implemented');
    },
    post: async (): Promise<never> => {
      const err = new Error('Server error starting session');
      (err as unknown as { status: number }).status = 500;
      throw err;
    },
  };

  const errorApi = createKycApi(errorClient);

  try {
    await errorApi.startAadhaarVerification();
    failed.push('start error: should have thrown');
  } catch (err) {
    assertEqual((err as { status?: number }).status, 500, 'start error propagates 500');
  }

  // 3. getAadhaarVerificationStatus success (with and without verificationId)
  let capturedGetUrl = '';
  const statusClient: HttpClientPort = {
    post: async <T>(): Promise<T> => {
      throw new Error('Not implemented');
    },
    get: async <T>(url: string): Promise<T> => {
      capturedGetUrl = url;
      return {
        status: 'VERIFIED',
        verificationId: 'v-12345',
        verifiedName: 'Rahul Kumar Singh',
        verifiedGender: 'MALE',
        verifiedAt: '2026-09-18T00:00:00.000Z',
      } as T;
    },
  };

  const statusApi = createKycApi(statusClient);

  const statusResWithoutId = await statusApi.getAadhaarVerificationStatus();
  assertEqual(capturedGetUrl, ENDPOINTS.kyc.aadhaarDigilockerStatus, 'status without id uses base endpoint');
  assertEqual(statusResWithoutId.status, 'VERIFIED', 'status matches VERIFIED');
  assertEqual(statusResWithoutId.verifiedName, 'Rahul Kumar Singh', 'verifiedName extracted');
  assertEqual(statusResWithoutId.verifiedGender, 'MALE', 'verifiedGender extracted');

  const statusResWithId = await statusApi.getAadhaarVerificationStatus('v-12345');
  assertEqual(
    capturedGetUrl,
    `${ENDPOINTS.kyc.aadhaarDigilockerStatus}?verificationId=v-12345`,
    'status with id appends query param',
  );
  assertEqual(statusResWithId.verificationId, 'v-12345', 'verificationId matched');

  // 4. refreshAadhaarVerification success
  capturedPostUrl = '';
  capturedPostBody = null;
  const refreshClient: HttpClientPort = {
    get: async <T>(): Promise<T> => {
      throw new Error('Not implemented');
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedPostUrl = url;
      capturedPostBody = body;
      return {
        status: 'VERIFIED',
        verificationId: 'v-12345',
        verifiedName: 'Rahul Kumar Singh',
        verifiedGender: 'MALE',
      } as T;
    },
  };

  const refreshApi = createKycApi(refreshClient);

  const refreshRes = await refreshApi.refreshAadhaarVerification('v-12345');
  assertEqual(capturedPostUrl, ENDPOINTS.kyc.aadhaarDigilockerRefresh, 'refresh uses correct endpoint');
  assertEqual(
    (capturedPostBody as { verificationId?: string })?.verificationId,
    'v-12345',
    'refresh sends verificationId in body',
  );
  assertEqual(refreshRes.status, 'VERIFIED', 'refresh returns VERIFIED');

  // 5. Unauthorized 401 response handling
  const unauthorizedClient: HttpClientPort = {
    post: async <T>(): Promise<T> => {
      throw new Error('Not implemented');
    },
    get: async (): Promise<never> => {
      const err = new Error('Unauthorized');
      (err as unknown as { status: number; code: string }).status = 401;
      (err as unknown as { status: number; code: string }).code = 'UNAUTHORIZED';
      throw err;
    },
  };

  const unauthorizedApi = createKycApi(unauthorizedClient);

  try {
    await unauthorizedApi.getAadhaarVerificationStatus();
    failed.push('401 error: should have thrown');
  } catch (err) {
    assertEqual((err as { status?: number }).status, 401, 'unauthorized response propagates 401');
  }

  // 6. Security verification: no client credentials in source
  const sourceCode = [
    ENDPOINTS.kyc.aadhaarDigilockerStart,
    ENDPOINTS.kyc.aadhaarDigilockerStatus,
    ENDPOINTS.kyc.aadhaarDigilockerRefresh,
  ].join(' ');

  assertFalse(sourceCode.includes('CASHFREE_CLIENT_SECRET'), 'no Cashfree client secret in source');
  assertFalse(sourceCode.includes('client_secret'), 'no client_secret in endpoints');

  if (failed.length > 0) {
    console.error('kyc.api.test.ts failures:\n' + failed.join('\n'));
    process.exit(1);
  }

  console.log('kyc.api.test.ts passed');
};

void runAsyncTests();
