import { ENDPOINTS, httpClient } from '@/network';
import type {
  CancelAccountDeletionResponse,
  GetAccountDeletionStatusResponse,
  SubmitAccountDeletionRequestPayload,
  SubmitAccountDeletionResponse,
} from './accountDeletion.types';

/**
 * Submit an account deletion request.
 * Transitions user lifecycle state to DELETION_REQUESTED, revokes normal sessions,
 * and schedules deletion under 7 Indian business-day processing.
 */
export const submitAccountDeletionRequest = (
  payload: SubmitAccountDeletionRequestPayload,
): Promise<SubmitAccountDeletionResponse> =>
  httpClient.post<SubmitAccountDeletionResponse>(
    ENDPOINTS.users.accountDeletion.request,
    payload,
  );

/**
 * Get the current account deletion status.
 * Accessible even with restricted deletion JWT (@AllowDeletionPending).
 */
export const getAccountDeletionStatus = (): Promise<GetAccountDeletionStatusResponse> =>
  httpClient.get<GetAccountDeletionStatusResponse>(
    ENDPOINTS.users.accountDeletion.status,
  );

/**
 * Cancel an active account deletion request.
 * Restores user lifecycle state to ACTIVE, re-enables full access,
 * and preserves all historical data. Accessible with restricted deletion JWT.
 */
export const cancelAccountDeletionRequest = (): Promise<CancelAccountDeletionResponse> =>
  httpClient.post<CancelAccountDeletionResponse>(
    ENDPOINTS.users.accountDeletion.cancel,
    {},
  );

