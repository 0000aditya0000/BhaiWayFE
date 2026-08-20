import type { ApiError } from '@/network/network.types';

import type {
  SubmitVerificationPayload,
  VerificationStatus,
  VerificationStatusView,
} from '../api/verification.types';
import { IDENTITY_DOCUMENT_TYPE } from '../api/verification.types';
import type { AadhaarVerifyForm } from '../types';

export const isIdentityVerifiedStatus = (status?: VerificationStatus | null): boolean =>
  status === 'VERIFIED';

export const isIdentityPendingStatus = (status?: VerificationStatus | null): boolean =>
  status === 'PENDING' || status === 'IN_REVIEW';

export const isIdentityFailedStatus = (status?: VerificationStatus | null): boolean =>
  status === 'REJECTED' || status === 'EXPIRED';

export const buildIdentitySubmitPayload = (
  form: Pick<AadhaarVerifyForm, 'frontSecureUrl' | 'backSecureUrl' | 'frontPublicId' | 'backPublicId'>,
): SubmitVerificationPayload => {
  const documentUrl = form.frontSecureUrl || form.backSecureUrl;

  const payload: SubmitVerificationPayload = {
    documentType: IDENTITY_DOCUMENT_TYPE,
  };

  if (documentUrl) {
    payload.documentUrl = documentUrl;
  }

  const documentReference = form.frontPublicId || form.backPublicId;
  if (documentReference) {
    payload.documentReference = documentReference;
  }

  return payload;
};

/** Client must never send verification outcome fields — only document metadata. */
export const assertClientControlledVerificationPayload = (
  payload: SubmitVerificationPayload,
): void => {
  const forbidden = ['verified', 'status', 'verificationStatus', 'providerResult'];
  for (const key of forbidden) {
    if (key in (payload as Record<string, unknown>)) {
      throw new Error(`Client must not send verification outcome field: ${key}`);
    }
  }
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getErrorText = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
};

export const mapIdentityVerificationError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (status === 409) {
    return 'An identity verification is already in progress or completed.';
  }

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400) {
    return text.trim() || 'Please check your verification details and try again.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to submit verification. Check your connection and try again.';
  }

  return text.trim() || 'Unable to submit identity verification. Please try again.';
};

export const resolveIdentityOutcomeMessage = (
  view: VerificationStatusView,
): { kind: 'verified' | 'pending' | 'failed'; message: string } => {
  if (isIdentityVerifiedStatus(view.status)) {
    return {
      kind: 'verified',
      message: 'Your identity has been verified.',
    };
  }

  if (isIdentityPendingStatus(view.status)) {
    return {
      kind: 'pending',
      message: 'Your identity verification is being processed.',
    };
  }

  if (isIdentityFailedStatus(view.status)) {
    return {
      kind: 'failed',
      message:
        view.rejectionReason?.trim() ||
        'Identity verification could not be completed. Please try again.',
    };
  }

  return {
    kind: 'pending',
    message: 'Your identity verification is being processed.',
  };
};
