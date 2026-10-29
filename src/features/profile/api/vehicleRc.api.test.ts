import { ENDPOINTS } from '../../../network/endpoints';

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

type HttpClientPort = {
  get: <T>(url: string, options?: unknown) => Promise<T>;
  post: <T>(url: string, body?: unknown, options?: unknown) => Promise<T>;
};

const createVehiclesApi = (client: HttpClientPort) => ({
  verifyVehicleRc: (vehicleId: string, vehicleNumber?: string) => {
    const trimmed = vehicleNumber?.replace(/\s+/g, '').trim().toUpperCase();
    const body = trimmed && trimmed.length > 0 ? { vehicleNumber: trimmed } : {};
    return client.post<{
      success: boolean;
      verification: {
        vehicleId: string;
        status: string;
        vehicleNumber: string;
        verifiedAt?: string;
        verificationId?: string;
        ownerMatchStatus?: string;
      };
    }>(ENDPOINTS.vehicles.verifyRc(vehicleId), body);
  },
});

const run = async () => {
  assertEqual(
    ENDPOINTS.vehicles.verifyRc('veh-1'),
    '/vehicles/veh-1/verify-rc',
    'verify-rc endpoint path',
  );

  let capturedUrl = '';
  let capturedBody: unknown = null;
  const successClient: HttpClientPort = {
    get: async <T>(): Promise<T> => {
      throw new Error('unused');
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      return {
        success: true,
        verification: {
          vehicleId: 'veh-1',
          status: 'VERIFIED',
          vehicleNumber: 'DL01AB1234',
          verifiedAt: '2026-09-18T01:54:45.000Z',
          verificationId: 'ver-1',
          ownerMatchStatus: 'MATCHED',
        },
      } as T;
    },
  };

  const api = createVehiclesApi(successClient);
  const res = await api.verifyVehicleRc('veh-1', 'DL01AB1234');
  assertEqual(capturedUrl, '/vehicles/veh-1/verify-rc', 'posts to verify-rc');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ vehicleNumber: 'DL01AB1234' }),
    'sends vehicleNumber when provided',
  );
  assertEqual(res.verification.status, 'VERIFIED', 'successful RC verification → VERIFIED');
  assertEqual(res.verification.ownerMatchStatus, 'MATCHED', 'owner match MATCHED');
  assertFalse(
    JSON.stringify(capturedBody).toLowerCase().includes('cashfree'),
    'no cashfree credentials in body',
  );
  assertFalse(
    JSON.stringify(capturedBody).toLowerCase().includes('secret'),
    'no secrets in body',
  );

  const emptyBodyClient: HttpClientPort = {
    get: async <T>(): Promise<T> => {
      throw new Error('unused');
    },
    post: async <T>(_url: string, body?: unknown): Promise<T> => {
      capturedBody = body;
      return {
        success: true,
        verification: {
          vehicleId: 'veh-1',
          status: 'VERIFIED',
          vehicleNumber: 'DL01AB1234',
        },
      } as T;
    },
  };
  await createVehiclesApi(emptyBodyClient).verifyVehicleRc('veh-1');
  assertEqual(JSON.stringify(capturedBody), '{}', 'omits vehicleNumber when empty');

  if (failed.length > 0) {
    throw new Error(`vehicles.api RC tests failed:\n${failed.join('\n')}`);
  }
  console.log('vehicles.api RC verification tests passed');
};

void run();
