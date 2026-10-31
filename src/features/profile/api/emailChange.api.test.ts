import { ENDPOINTS } from '@/network/endpoints';
import {
  RequestEmailChangeRequest,
  RequestEmailChangeResponse,
  VerifyEmailChangeRequest,
  VerifyEmailChangeResponse,
} from './emailChange.api';

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
  post: <T>(url: string, body?: unknown, options?: unknown) => Promise<T>;
};

const createEmailChangeApi = (client: HttpClientPort) => ({
  requestEmailChangeOtp: (newEmail: string): Promise<RequestEmailChangeResponse> =>
    client.post<RequestEmailChangeResponse>(ENDPOINTS.users.emailChange.request, {
      newEmail: newEmail.trim().toLowerCase(),
    } satisfies RequestEmailChangeRequest),

  verifyEmailChangeOtp: (
    payload: VerifyEmailChangeRequest,
  ): Promise<VerifyEmailChangeResponse> =>
    client.post<VerifyEmailChangeResponse>(ENDPOINTS.users.emailChange.verify, {
      newEmail: payload.newEmail.trim().toLowerCase(),
      otp: payload.otp.trim(),
    } satisfies VerifyEmailChangeRequest),
});

const run = async () => {
  // Endpoints check
  assertEqual(
    ENDPOINTS.users.emailChange.request,
    '/users/me/email/change/request',
    'request OTP endpoint match',
  );
  assertEqual(
    ENDPOINTS.users.emailChange.verify,
    '/users/me/email/change/verify',
    'verify OTP endpoint match',
  );

  let capturedUrl = '';
  let capturedBody: unknown = null;

  const mockClient: HttpClientPort = {
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      capturedUrl = url;
      capturedBody = body;
      if (url === ENDPOINTS.users.emailChange.request) {
        return {
          success: true,
          message: 'Verification OTP sent to your new email address.',
        } as T;
      }
      return {
        success: true,
        message: 'Email address updated successfully.',
        user: {
          email: (body as VerifyEmailChangeRequest).newEmail,
          emailVerified: true,
        },
      } as T;
    },
  };

  const api = createEmailChangeApi(mockClient);

  // Test Request OTP
  const requestRes = await api.requestEmailChangeOtp('  New.Driver@Example.COM  ');
  assertEqual(
    capturedUrl,
    '/users/me/email/change/request',
    'request OTP calls correct endpoint',
  );
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({ newEmail: 'new.driver@example.com' }),
    'request OTP normalizes email (trimmed and lowercase)',
  );
  assertTrue(requestRes.success, 'request OTP returns success');
  assertEqual(
    requestRes.message,
    'Verification OTP sent to your new email address.',
    'request OTP returns expected message',
  );

  // Test Verify OTP
  const verifyRes = await api.verifyEmailChangeOtp({
    newEmail: ' New.Driver@Example.COM ',
    otp: ' 6543 ',
  });
  assertEqual(
    capturedUrl,
    '/users/me/email/change/verify',
    'verify OTP calls correct endpoint',
  );
  assertEqual(
    JSON.stringify(capturedBody),
    JSON.stringify({
      newEmail: 'new.driver@example.com',
      otp: '6543',
    }),
    'verify OTP normalizes email and trims 6-digit OTP',
  );
  assertTrue(verifyRes.success, 'verify OTP returns success');
  assertEqual(
    verifyRes.user.email,
    'new.driver@example.com',
    'verify OTP returns updated user email',
  );
  assertTrue(verifyRes.user.emailVerified, 'verify OTP sets emailVerified true');

  if (failed.length > 0) {
    throw new Error(`emailChange.api tests failed:\n${failed.join('\n')}`);
  }
  console.log('All emailChange.api tests passed successfully!');
};

void run();
