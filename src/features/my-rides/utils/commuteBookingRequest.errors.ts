import { getErrorMessage } from '@/shared/utils';

import { COMMUTE_BOOKING_REQUESTS_SCREEN } from '../constants/commute-booking-requests.constants';

const isApiError = (error: unknown): error is { status: number; message?: string; code?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

const normalizeErrorCode = (error: unknown): string => {
  if (!isApiError(error)) {
    return '';
  }
  const record = error as { code?: string; message?: string };
  const code = String(record.code ?? '').trim().toUpperCase();
  if (code) {
    return code;
  }
  const message = String(record.message ?? '').trim().toUpperCase();
  if (message.includes('INSUFFICIENT') && message.includes('SEAT')) {
    return 'INSUFFICIENT_SEATS';
  }
  return '';
};

export const mapCommuteBookingAcceptError = (error: unknown): string => {
  const code = normalizeErrorCode(error);
  if (code === 'INSUFFICIENT_SEATS' || (isApiError(error) && error.status === 409)) {
    return COMMUTE_BOOKING_REQUESTS_SCREEN.insufficientSeatsMessage;
  }
  if (isApiError(error) && (error.status === 404 || error.status === 410)) {
    return COMMUTE_BOOKING_REQUESTS_SCREEN.alreadyProcessedMessage;
  }
  if (isApiError(error) && error.status === 422) {
    return getErrorMessage(error, COMMUTE_BOOKING_REQUESTS_SCREEN.acceptFailedMessage);
  }
  return getErrorMessage(error, COMMUTE_BOOKING_REQUESTS_SCREEN.acceptFailedMessage);
};

export const mapCommuteBookingRejectError = (error: unknown): string => {
  if (isApiError(error) && (error.status === 404 || error.status === 410)) {
    return COMMUTE_BOOKING_REQUESTS_SCREEN.alreadyProcessedMessage;
  }
  return getErrorMessage(error, COMMUTE_BOOKING_REQUESTS_SCREEN.rejectFailedMessage);
};
