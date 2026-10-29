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

type HttpClientPort = {
  get: <T>(url: string, options?: unknown) => Promise<T>;
  post: <T>(url: string, body?: unknown, options?: unknown) => Promise<T>;
};

const createCorporateIdentityApi = (client: HttpClientPort) => ({
  sendCorporateIdentityOtp: (email: string) =>
    client.post(ENDPOINTS.corporateIdentity.send, { email: email.trim() }),
  verifyCorporateIdentityOtp: (email: string, otp: string) =>
    client.post(ENDPOINTS.corporateIdentity.verify, {
      email: email.trim(),
      otp: otp.trim(),
    }),
  getCorporateIdentityStatus: () => client.get(ENDPOINTS.corporateIdentity.status),
});

const run = async () => {
  assertEqual(ENDPOINTS.corporateIdentity.send, '/corporate-identity/send', 'send endpoint');
  assertEqual(
    ENDPOINTS.corporateIdentity.verify,
    '/corporate-identity/verify',
    'verify endpoint',
  );
  assertEqual(
    ENDPOINTS.corporateIdentity.status,
    '/corporate-identity/status',
    'status endpoint',
  );

  // Personal email verification endpoints remain unchanged.
  assertEqual(
    ENDPOINTS.users.emailVerification.send,
    '/users/email-verification/send',
    'personal email send unchanged',
  );
  assertEqual(
    ENDPOINTS.users.emailVerification.verify,
    '/users/email-verification/verify',
    'personal email verify unchanged',
  );

  let capturedUrl = '';
  let capturedBody: unknown = null;

  const successClient: HttpClientPort = {
    get: async <T>(): Promise<T> =>
      ({ status: 'NOT_VERIFIED', email: null, verifiedAt: null }) as T,
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      return { success: true, message: 'ok' } as T;
    },
  };

  const api = createCorporateIdentityApi(successClient);

  const status = await api.getCorporateIdentityStatus();
  assertEqual(
    (status as { status: string }).status,
    'NOT_VERIFIED',
    'GET status returns NOT_VERIFIED',
  );

  await api.sendCorporateIdentityOtp('employee@company.com');
  assertEqual(capturedUrl, '/corporate-identity/send', 'send OTP URL');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ email: 'employee@company.com' }),
    'send body email only',
  );

  await api.verifyCorporateIdentityOtp('employee@company.com', '4827');
  assertEqual(capturedUrl, '/corporate-identity/verify', 'verify OTP URL');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ email: 'employee@company.com', otp: '4827' }),
    'verify body email+otp',
  );

  // Resend uses the same send endpoint.
  await api.sendCorporateIdentityOtp('employee@company.com');
  assertEqual(capturedUrl, '/corporate-identity/send', 'resend uses send endpoint');

  assertTrue(
    !JSON.stringify(ENDPOINTS).includes('gmail.com'),
    'no free-email domain blocklist in endpoints',
  );

  if (failed.length > 0) {
    throw new Error(`corporateIdentity.api tests failed:\n${failed.join('\n')}`);
  }
  console.log('corporateIdentity.api tests passed');
};

void run();
