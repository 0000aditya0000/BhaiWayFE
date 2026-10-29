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

const createEmailVerificationApi = (client: HttpClientPort) => ({
  sendEmailVerification: (email: string) =>
    client.post<{ success: boolean; message: string }>(
      ENDPOINTS.users.emailVerification.send,
      { email: email.trim() },
    ),
  verifyEmail: (otp: string) =>
    client.post<{ success: boolean; message: string }>(
      ENDPOINTS.users.emailVerification.verify,
      { otp: otp.trim() },
    ),
  getEmailVerificationStatus: () =>
    client.get<{ email: string | null; verified: boolean }>(
      ENDPOINTS.users.emailVerification.status,
    ),
});

const run = async () => {
  assertEqual(
    ENDPOINTS.users.emailVerification.send,
    '/users/email-verification/send',
    'send endpoint',
  );
  assertEqual(
    ENDPOINTS.users.emailVerification.verify,
    '/users/email-verification/verify',
    'verify endpoint',
  );
  assertEqual(
    ENDPOINTS.users.emailVerification.status,
    '/users/email-verification/status',
    'status endpoint',
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
      return { success: true, message: 'Verification code sent to your email.' } as T;
    },
  };

  const api = createEmailVerificationApi(successClient);
  const sendRes = await api.sendEmailVerification('user@example.com');
  assertEqual(capturedUrl, '/users/email-verification/send', 'send OTP success URL');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ email: 'user@example.com' }),
    'send body has email only',
  );
  assertFalse(JSON.stringify(capturedBody).includes('userId'), 'does not send userId');
  assertTrue(sendRes.success, 'send OTP success');

  const failClient: HttpClientPort = {
    get: async <T>(): Promise<T> => {
      throw new Error('unused');
    },
    post: async (): Promise<never> => {
      const err = Object.assign(new Error('send failed'), {
        status: 500,
        code: 'EMAIL_SEND_FAILED',
      });
      throw err;
    },
  };

  try {
    await createEmailVerificationApi(failClient).sendEmailVerification('user@example.com');
    failed.push('send OTP failure: should throw');
  } catch (err) {
    assertEqual((err as { code?: string }).code, 'EMAIL_SEND_FAILED', 'send OTP failure code');
  }

  const verifyClient: HttpClientPort = {
    get: async <T>(): Promise<T> => {
      throw new Error('unused');
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      return { success: true, message: 'Email verified successfully.' } as T;
    },
  };

  const verifyRes = await createEmailVerificationApi(verifyClient).verifyEmail('4827');
  assertEqual(capturedUrl, '/users/email-verification/verify', 'verify correct OTP URL');
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ otp: '4827' }),
    'verify body has otp only',
  );
  assertFalse(JSON.stringify(capturedBody).includes('userId'), 'verify does not send userId');
  assertTrue(verifyRes.success, 'verify correct OTP success');

  if (failed.length > 0) {
    throw new Error(`emailVerification.api tests failed:\n${failed.join('\n')}`);
  }
  console.log('emailVerification.api tests passed');
};

void run();
