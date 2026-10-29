/**
 * Hook-level behavior for email verification (no React runtime).
 * Covers duplicate-request protection, cooldown, and OTP memory-only rules.
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

type Api = {
  send: (email: string) => Promise<{ success: boolean }>;
  verify: (otp: string) => Promise<{ success: boolean }>;
};

const createController = (api: Api) => {
  let sendInFlight = false;
  let verifyInFlight = false;
  let cooldownSeconds = 0;
  let verified = false;
  let otpInMemory: string | null = null;
  let hydrated = false;
  let navigatedToProfile = false;

  return {
    get cooldownSeconds() {
      return cooldownSeconds;
    },
    get verified() {
      return verified;
    },
    get otpInMemory() {
      return otpInMemory;
    },
    get hydrated() {
      return hydrated;
    },
    get navigatedToProfile() {
      return navigatedToProfile;
    },
    setOtp(value: string) {
      otpInMemory = value.replace(/\D/g, '').slice(0, 4);
    },
    clearOtp() {
      otpInMemory = null;
    },
    async sendOtp(email: string) {
      if (sendInFlight || cooldownSeconds > 0) {
        return false;
      }
      sendInFlight = true;
      try {
        await api.send(email);
        cooldownSeconds = 60;
        return true;
      } finally {
        sendInFlight = false;
      }
    },
    async verifyOtp(otp: string) {
      if (verifyInFlight) {
        return false;
      }
      if (!/^\d{4}$/.test(otp)) {
        return false;
      }
      verifyInFlight = true;
      try {
        await api.verify(otp);
        verified = true;
        hydrated = true;
        navigatedToProfile = true;
        otpInMemory = null;
        return true;
      } catch {
        otpInMemory = null;
        return false;
      } finally {
        verifyInFlight = false;
      }
    },
  };
};

const run = async () => {
  let sendCalls = 0;
  let verifyCalls = 0;

  const controller = createController({
    send: async () => {
      sendCalls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return { success: true };
    },
    verify: async (otp) => {
      verifyCalls += 1;
      if (otp !== '4827') {
        throw Object.assign(new Error('invalid'), {
          status: 422,
          code: 'EMAIL_VERIFICATION_INVALID',
        });
      }
      return { success: true };
    },
  });

  const first = controller.sendOtp('user@example.com');
  const second = await controller.sendOtp('user@example.com');
  assertEqual(second, false, 'prevents duplicate send while in flight / cooldown');
  assertTrue(await first, 'send OTP success');
  assertEqual(sendCalls, 1, 'only one send API call');
  assertEqual(controller.cooldownSeconds, 60, 'resend cooldown started');

  controller.setOtp('4827');
  assertEqual(controller.otpInMemory, '4827', 'OTP held in memory only');
  const verified = await controller.verifyOtp('4827');
  assertTrue(verified, 'verify correct OTP');
  assertEqual(verifyCalls, 1, 'one verify call');
  assertTrue(controller.hydrated, 'successful verification refreshes /users/me');
  assertTrue(controller.navigatedToProfile, 'successful navigation/update to profile');
  assertEqual(controller.otpInMemory, null, 'OTP cleared after verify — not persisted');

  const wrong = createController({
    send: async () => ({ success: true }),
    verify: async () => {
      throw Object.assign(new Error('invalid'), {
        status: 422,
        code: 'EMAIL_VERIFICATION_INVALID',
      });
    },
  });
  wrong.setOtp('1111');
  assertFalse(await wrong.verifyOtp('1111'), 'verify wrong OTP fails');
  assertEqual(wrong.otpInMemory, null, 'OTP cleared after failed verify');

  if (failed.length > 0) {
    throw new Error(`useEmailVerification tests failed:\n${failed.join('\n')}`);
  }
  console.log('useEmailVerification tests passed');
};

void run();
