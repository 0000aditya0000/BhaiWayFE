import { getErrorMessage } from '@/shared/utils';

const isApiError = (
  error: unknown,
): error is { status: number; code?: string; message?: string } =>
  Boolean(error && typeof error === 'object' && 'status' in error);

/** True when backend ride/booking status is already COMPLETED. */
export const isCompletedRideStatus = (status: string | null | undefined): boolean =>
  String(status ?? '').trim().toUpperCase() === 'COMPLETED';

/** Maps lifecycle API failures (start ride, verify pickup, complete) to user-facing copy. */
export const mapLifecycleError = (error: unknown, fallback: string): string => {
  if (isApiError(error)) {
    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 404) {
      return 'This ride or booking could not be found.';
    }
    if (error.status === 409) {
      return error.message?.trim() || 'This action was already completed.';
    }
    if (error.status === 422) {
      return error.message?.trim() || 'Invalid request. Please check and try again.';
    }
    if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
      return (
        error.message?.trim() ||
        'Request timed out. If the trip already ended, pull to refresh My Rides.'
      );
    }
    if (error.message?.trim()) {
      return error.message.trim();
    }
  }
  return getErrorMessage(error) || fallback;
};
