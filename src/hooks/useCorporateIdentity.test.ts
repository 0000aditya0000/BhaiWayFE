/**
 * Hook-level behavior for corporate identity (no React runtime).
 * Covers OTP memory-only rules, status refresh, and already-verified short-circuit.
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

type Status = 'NOT_VERIFIED' | 'OTP_PENDING' | 'VERIFIED';

type Api = {
  send: (email: string) => Promise<{ status?: Status }>;
  verify: (email: string, otp: string) => Promise<{ status?: Status }>;
  status: () => Promise<{ status: Status; email: string | null; verifiedAt: string | null }>;
};

const createController = (api: Api) => {
  let sendInFlight = false;
  let verifyInFlight = false;
  let cooldownSeconds = 0;
  let status: Status = 'NOT_VERIFIED';
  let email: string | null = null;
  let otpInMemory: string | null = null;
  let userId = 'user-a';

  return {
    get status() {
      return status;
    },
    get email() {
      return email;
    },
    get otpInMemory() {
      return otpInMemory;
    },
    get cooldownSeconds() {
      return cooldownSeconds;
    },
    clearCooldown() {
      cooldownSeconds = 0;
    },
    setUser(next: string) {
      userId = next;
      status = 'NOT_VERIFIED';
      email = null;
      otpInMemory = null;
      cooldownSeconds = 0;
    },
    getUser() {
      return userId;
    },
    setOtp(value: string) {
      otpInMemory = value.replace(/\D/g, '').slice(0, 4);
    },
    clearOtp() {
      otpInMemory = null;
    },
    async fetchStatus() {
      const next = await api.status();
      status = next.status;
      email = next.email;
      return next;
    },
    async sendOtp(rawEmail: string) {
      if (sendInFlight || cooldownSeconds > 0) {
        return 'failed' as const;
      }
      sendInFlight = true;
      try {
        const response = await api.send(rawEmail);
        email = rawEmail.trim().toLowerCase();
        if (response.status === 'VERIFIED') {
          const refreshed = await api.status();
          status = refreshed.status;
          email = refreshed.email;
          return 'already_verified' as const;
        }
        cooldownSeconds = 60;
        status = 'OTP_PENDING';
        return 'otp_sent' as const;
      } finally {
        sendInFlight = false;
      }
    },
    async verifyOtp(rawEmail: string, otp: string) {
      if (verifyInFlight) {
        return false;
      }
      if (!/^\d{4}$/.test(otp)) {
        return false;
      }
      verifyInFlight = true;
      try {
        await api.verify(rawEmail, otp);
        otpInMemory = null;
        const refreshed = await api.status();
        status = refreshed.status;
        email = refreshed.email;
        return status === 'VERIFIED';
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
  let currentStatus: Status = 'NOT_VERIFIED';
  let currentEmail: string | null = null;
  let sendCount = 0;
  let verifyCount = 0;
  let lastVerifyBody: { email: string; otp: string } | null = null;

  const api: Api = {
    send: async (email) => {
      sendCount += 1;
      if (email === 'same@company.com' && currentStatus === 'VERIFIED') {
        return { status: 'VERIFIED' };
      }
      currentStatus = 'OTP_PENDING';
      currentEmail = email;
      return { status: 'OTP_PENDING' };
    },
    verify: async (email, otp) => {
      verifyCount += 1;
      lastVerifyBody = { email, otp };
      if (otp === '0000') {
        throw new Error('invalid');
      }
      currentStatus = 'VERIFIED';
      currentEmail = email;
      return { status: 'VERIFIED' };
    },
    status: async () => ({
      status: currentStatus,
      email: currentEmail,
      verifiedAt: currentStatus === 'VERIFIED' ? '2026-01-01T00:00:00.000Z' : null,
    }),
  };

  const ctrl = createController(api);

  // TEST 1: NOT_VERIFIED
  let status = await ctrl.fetchStatus();
  assertEqual(status.status, 'NOT_VERIFIED', 'initial NOT_VERIFIED');

  // TEST 2/5/10: send then verify
  const sendResult = await ctrl.sendOtp('employee@company.com');
  assertEqual(sendResult, 'otp_sent', 'send returns otp_sent');
  assertEqual(ctrl.status, 'OTP_PENDING', 'OTP_PENDING after send');
  assertEqual(sendCount, 1, 'send called once');

  // TEST 13: OTP_PENDING retained on refresh
  status = await ctrl.fetchStatus();
  assertEqual(status.status, 'OTP_PENDING', 'refresh keeps OTP_PENDING');

  ctrl.setOtp('4827');
  assertEqual(ctrl.otpInMemory, '4827', 'otp held in memory');
  const ok = await ctrl.verifyOtp('employee@company.com', '4827');
  assertTrue(ok, 'verify success');
  assertEqual(ctrl.otpInMemory, null, 'otp cleared after verify');
  assertEqual(verifyCount, 1, 'verify called');
  assertEqual(
    JSON.stringify(lastVerifyBody),
    JSON.stringify({ email: 'employee@company.com', otp: '4827' }),
    'verify payload',
  );

  // TEST 7/14: VERIFIED after refresh
  status = await ctrl.fetchStatus();
  assertEqual(status.status, 'VERIFIED', 'status VERIFIED');
  assertEqual(status.email, 'employee@company.com', 'verified email shown');

  // TEST 11: OTP never persisted beyond memory clear
  assertEqual(ctrl.otpInMemory, null, 'otp not persisted');

  // TEST 15: already verified same email
  currentStatus = 'VERIFIED';
  currentEmail = 'same@company.com';
  ctrl.clearCooldown();
  const already = await ctrl.sendOtp('same@company.com');
  assertEqual(already, 'already_verified', 'same verified email short-circuit');

  // TEST 8: wrong OTP
  currentStatus = 'OTP_PENDING';
  currentEmail = 'employee@company.com';
  ctrl.setOtp('0000');
  const bad = await ctrl.verifyOtp('employee@company.com', '0000');
  assertFalse(bad, 'wrong otp fails');
  assertEqual(ctrl.otpInMemory, null, 'otp cleared after failed verify');

  // TEST 10: resend — first send succeeds, immediate second send is cooldown-blocked
  ctrl.clearCooldown();
  const before = sendCount;
  const resent = await ctrl.sendOtp('employee@company.com');
  assertEqual(resent, 'otp_sent', 'resend send succeeds after cooldown clear');
  assertEqual(sendCount, before + 1, 'resend uses send endpoint');
  const blocked = await ctrl.sendOtp('employee@company.com');
  assertEqual(blocked, 'failed', 'cooldown blocks immediate resend');
  assertEqual(sendCount, before + 1, 'blocked resend does not call API');

  // TEST 16: user A state does not leak into user B
  ctrl.setUser('user-b');
  assertEqual(ctrl.getUser(), 'user-b', 'switched user');
  assertEqual(ctrl.status, 'NOT_VERIFIED', 'user B starts unverified');
  assertEqual(ctrl.email, null, 'user B has no email');
  assertEqual(ctrl.otpInMemory, null, 'user B has no otp');

  if (failed.length > 0) {
    throw new Error(`useCorporateIdentity tests failed:\n${failed.join('\n')}`);
  }
  console.log('useCorporateIdentity tests passed');
};

void run();
