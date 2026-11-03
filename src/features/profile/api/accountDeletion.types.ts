export enum AccountDeletionRequestStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DeletionReason {
  NO_LONGER_USING = 'NO_LONGER_USING',
  PRIVACY_CONCERNS = 'PRIVACY_CONCERNS',
  POOR_USER_EXPERIENCE = 'POOR_USER_EXPERIENCE',
  SWITCHED_TO_ANOTHER_SERVICE = 'SWITCHED_TO_ANOTHER_SERVICE',
  ACCOUNT_OR_TECHNICAL_ISSUES = 'ACCOUNT_OR_TECHNICAL_ISSUES',
  OTHER = 'OTHER',
}

export interface SubmitAccountDeletionRequestPayload {
  reason: DeletionReason;
  additionalComment?: string;
  acceptedDeletionTerms: boolean;
}

export interface AccountDeletionRequestSummaryDto {
  id: string;
  status: AccountDeletionRequestStatus;
  reason: DeletionReason;
  requestedAt: string;
  responseDueAt: string;
  userActionRequired: boolean;
  userActionMessage: string | null;
  canCancel: boolean;
  isCompleted: boolean;
}

export interface SubmitAccountDeletionResponse {
  success: boolean;
  request: {
    id: string;
    status: AccountDeletionRequestStatus;
    requestedAt: string;
    responseDueAt: string;
  };
  message: string;
}

export interface GetAccountDeletionStatusResponse {
  hasActiveRequest: boolean;
  request: AccountDeletionRequestSummaryDto | null;
}

export interface CancelAccountDeletionResponse {
  success: boolean;
  message: string;
}

