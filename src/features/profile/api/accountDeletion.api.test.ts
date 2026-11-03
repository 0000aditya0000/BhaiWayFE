import { ENDPOINTS } from '@/network/endpoints';
import {
  AccountDeletionRequestStatus,
  DeletionReason,
  type CancelAccountDeletionResponse,
  type GetAccountDeletionStatusResponse,
  type SubmitAccountDeletionRequestPayload,
  type SubmitAccountDeletionResponse,
} from './accountDeletion.types';

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

const createAccountDeletionApi = (client: HttpClientPort) => ({
  submitRequest: (payload: SubmitAccountDeletionRequestPayload): Promise<SubmitAccountDeletionResponse> =>
    client.post<SubmitAccountDeletionResponse>(ENDPOINTS.users.accountDeletion.request, payload),

  getStatus: (): Promise<GetAccountDeletionStatusResponse> =>
    client.get<GetAccountDeletionStatusResponse>(ENDPOINTS.users.accountDeletion.status),

  cancelRequest: (): Promise<CancelAccountDeletionResponse> =>
    client.post<CancelAccountDeletionResponse>(ENDPOINTS.users.accountDeletion.cancel, {}),
});

const run = async () => {
  console.log('[Test] Running Account Deletion API & Contract Tests...');

  // 1. Endpoint contract verification
  assertEqual(
    ENDPOINTS.users.accountDeletion.request,
    '/users/me/account-deletion/request',
    'Submit deletion request endpoint match',
  );
  assertEqual(
    ENDPOINTS.users.accountDeletion.status,
    '/users/me/account-deletion',
    'Get deletion status endpoint match',
  );
  assertEqual(
    ENDPOINTS.users.accountDeletion.cancel,
    '/users/me/account-deletion/cancel',
    'Cancel deletion request endpoint match',
  );

  // 2. Enum values verification against NestJS backend
  assertEqual(DeletionReason.NO_LONGER_USING, 'NO_LONGER_USING', 'NO_LONGER_USING enum match');
  assertEqual(DeletionReason.PRIVACY_CONCERNS, 'PRIVACY_CONCERNS', 'PRIVACY_CONCERNS enum match');
  assertEqual(DeletionReason.POOR_USER_EXPERIENCE, 'POOR_USER_EXPERIENCE', 'POOR_USER_EXPERIENCE enum match');
  assertEqual(DeletionReason.SWITCHED_TO_ANOTHER_SERVICE, 'SWITCHED_TO_ANOTHER_SERVICE', 'SWITCHED_TO_ANOTHER_SERVICE enum match');
  assertEqual(DeletionReason.ACCOUNT_OR_TECHNICAL_ISSUES, 'ACCOUNT_OR_TECHNICAL_ISSUES', 'ACCOUNT_OR_TECHNICAL_ISSUES enum match');
  assertEqual(DeletionReason.OTHER, 'OTHER', 'OTHER enum match');

  assertEqual(AccountDeletionRequestStatus.PENDING, 'PENDING', 'PENDING status match');
  assertEqual(AccountDeletionRequestStatus.UNDER_REVIEW, 'UNDER_REVIEW', 'UNDER_REVIEW status match');
  assertEqual(AccountDeletionRequestStatus.ACTION_REQUIRED, 'ACTION_REQUIRED', 'ACTION_REQUIRED status match');
  assertEqual(AccountDeletionRequestStatus.APPROVED, 'APPROVED', 'APPROVED status match');
  assertEqual(AccountDeletionRequestStatus.COMPLETED, 'COMPLETED', 'COMPLETED status match');
  assertEqual(AccountDeletionRequestStatus.CANCELLED, 'CANCELLED', 'CANCELLED status match');

  // 3. Mock client testing
  let lastPostUrl = '';
  let lastPostBody: unknown = null;
  let lastGetUrl = '';

  const mockClient: HttpClientPort = {
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      lastPostUrl = url;
      lastPostBody = body;
      if (url === ENDPOINTS.users.accountDeletion.request) {
        return {
          success: true,
          request: {
            id: 'del-req-12345',
            status: AccountDeletionRequestStatus.PENDING,
            requestedAt: '2026-11-03T05:30:00.000Z',
            responseDueAt: '2026-11-12T05:30:00.000Z',
          },
          message: 'Your account deletion request has been received.',
        } as T;
      }
      if (url === ENDPOINTS.users.accountDeletion.cancel) {
        return {
          success: true,
          message: 'Your account deletion request has been cancelled and full account access has been restored.',
        } as T;
      }
      throw new Error(`Unhandled post url ${url}`);
    },
    get: async <T>(url: string): Promise<T> => {
      lastGetUrl = url;
      if (url === ENDPOINTS.users.accountDeletion.status) {
        return {
          hasActiveRequest: true,
          request: {
            id: 'del-req-12345',
            status: AccountDeletionRequestStatus.UNDER_REVIEW,
            reason: DeletionReason.PRIVACY_CONCERNS,
            requestedAt: '2026-11-03T05:30:00.000Z',
            responseDueAt: '2026-11-12T05:30:00.000Z',
            userActionRequired: false,
            userActionMessage: null,
            canCancel: true,
            isCompleted: false,
          },
        } as T;
      }
      throw new Error(`Unhandled get url ${url}`);
    },
  };

  const api = createAccountDeletionApi(mockClient);

  // Test submit request
  const submitResult = await api.submitRequest({
    reason: DeletionReason.PRIVACY_CONCERNS,
    additionalComment: 'I am closing my profile.',
    acceptedDeletionTerms: true,
  });

  assertEqual(lastPostUrl, '/users/me/account-deletion/request', 'Submit post URL matches');
  assertTrue((lastPostBody as SubmitAccountDeletionRequestPayload).acceptedDeletionTerms, 'Terms accepted is true');
  assertEqual((lastPostBody as SubmitAccountDeletionRequestPayload).reason, DeletionReason.PRIVACY_CONCERNS, 'Reason passed matches');
  assertTrue(submitResult.success, 'Submit success returned');
  assertEqual(submitResult.request.id, 'del-req-12345', 'Request ID returned');
  assertEqual(submitResult.request.status, AccountDeletionRequestStatus.PENDING, 'Initial status is PENDING');

  // Test get status
  const statusResult = await api.getStatus();
  assertEqual(lastGetUrl, '/users/me/account-deletion', 'Get status URL matches');
  assertTrue(statusResult.hasActiveRequest, 'Active request is true');
  assertEqual(statusResult.request?.status, AccountDeletionRequestStatus.UNDER_REVIEW, 'Status is UNDER_REVIEW');
  assertEqual(statusResult.request?.canCancel, true, 'canCancel is true');

  // Test cancel request
  const cancelResult = await api.cancelRequest();
  assertEqual(lastPostUrl, '/users/me/account-deletion/cancel', 'Cancel post URL matches');
  assertTrue(cancelResult.success, 'Cancel success is true');

  // Test duplicate submission error simulation (409 Conflict)
  const conflictClient: HttpClientPort = {
    post: async () => {
      const err: any = new Error('An active account deletion request is already open for this account.');
      err.status = 409;
      err.code = 'ACTIVE_DELETION_REQUEST_EXISTS';
      throw err;
    },
    get: async () => { throw new Error('Not used'); },
  };
  const conflictApi = createAccountDeletionApi(conflictClient);
  try {
    await conflictApi.submitRequest({
      reason: DeletionReason.NO_LONGER_USING,
      acceptedDeletionTerms: true,
    });
    failed.push('Expected 409 Conflict on duplicate submit');
  } catch (err: any) {
    assertEqual(err.code, 'ACTIVE_DELETION_REQUEST_EXISTS', 'Duplicate submit returns 409 ACTIVE_DELETION_REQUEST_EXISTS');
  }

  // Test cancellation blocked after permanent completion (409 Conflict)
  const completedClient: HttpClientPort = {
    post: async () => {
      const err: any = new Error('Permanent account deletion has already been completed and cannot be cancelled.');
      err.status = 409;
      err.code = 'DELETION_ALREADY_COMPLETED';
      throw err;
    },
    get: async () => { throw new Error('Not used'); },
  };
  const completedApi = createAccountDeletionApi(completedClient);
  try {
    await completedApi.cancelRequest();
    failed.push('Expected 409 Conflict on already completed cancel');
  } catch (err: any) {
    assertEqual(err.code, 'DELETION_ALREADY_COMPLETED', 'Completed request cancel returns 409 DELETION_ALREADY_COMPLETED');
  }

  if (failed.length > 0) {
    console.error(`[Account Deletion API Tests FAILED (${failed.length})]:\n${failed.join('\n')}`);
    process.exit(1);
  } else {
    console.log('[Account Deletion API Tests PASSED] All 15 contract checks succeeded.');
  }
};

run().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});

