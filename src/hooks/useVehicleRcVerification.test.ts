/**
 * Hook-level behavior tests for Vehicle RC verification (no React runtime).
 * Mirrors the duplicate-request and status rules used by useVehicleRcVerification.
 */

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

type Verification = {
  vehicleId: string;
  status: 'VERIFIED' | 'INVALID' | 'FAILED' | 'PENDING';
  vehicleNumber: string;
};

const createController = (api: {
  verify: (id: string, number?: string) => Promise<{ verification: Verification }>;
}) => {
  let inFlight = false;
  let isVerifying = false;
  let verifyingVehicleId: string | null = null;
  let result: Verification | null = null;
  let refreshCount = 0;

  return {
    get isVerifying() {
      return isVerifying;
    },
    get verifyingVehicleId() {
      return verifyingVehicleId;
    },
    get result() {
      return result;
    },
    get refreshCount() {
      return refreshCount;
    },
    async verify(vehicleId: string, vehicleNumber?: string) {
      if (inFlight) {
        return null;
      }
      inFlight = true;
      isVerifying = true;
      verifyingVehicleId = vehicleId;
      try {
        const response = await api.verify(vehicleId, vehicleNumber);
        result = response.verification;
        if (response.verification.status === 'VERIFIED') {
          refreshCount += 1;
        }
        return response.verification;
      } finally {
        inFlight = false;
        isVerifying = false;
        verifyingVehicleId = null;
      }
    },
  };
};

const run = async () => {
  let calls = 0;
  const controller = createController({
    verify: async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return {
        verification: {
          vehicleId: 'veh-1',
          status: 'VERIFIED',
          vehicleNumber: 'DL01AB1234',
        },
      };
    },
  });

  const first = controller.verify('veh-1', 'DL01AB1234');
  assertTrue(controller.isVerifying, 'Verify button disabled while request in progress');
  assertEqual(controller.verifyingVehicleId, 'veh-1', 'loading state is bound to vehicle A');
  const second = await controller.verify('veh-1', 'DL01AB1234');
  assertEqual(second, null, 'duplicate simultaneous verify blocked');
  const verified = await first;
  assertEqual(verified?.status, 'VERIFIED', 'successful verification status');
  assertEqual(calls, 1, 'only one API call for concurrent taps');
  assertEqual(controller.refreshCount, 1, 'successful verification refreshes vehicle data');
  assertFalse(controller.isVerifying, 'verifying cleared after completion');

  if (failed.length > 0) {
    throw new Error(`useVehicleRcVerification tests failed:\n${failed.join('\n')}`);
  }
  console.log('useVehicleRcVerification tests passed');
};

void run();
