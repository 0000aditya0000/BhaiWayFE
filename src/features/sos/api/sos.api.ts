import { ENDPOINTS, httpClient, type ApiError } from '@/network';

import type { SosLocationRequest, SosRecord, TriggerSosRequest } from './sos.types';
import { unwrapSosRecord } from './sos.unwrap';

export const triggerRideSos = async (
  rideId: string,
  body: TriggerSosRequest,
): Promise<SosRecord> => {
  const payload = await httpClient.post<unknown>(ENDPOINTS.rides.sos(rideId), body, {
    headers: {
      'Idempotency-Key': body.idempotencyKey,
    },
  });
  const record = unwrapSosRecord(payload);
  if (!record) {
    throw {
      status: 500,
      code: 'SOS_UNCONFIRMED',
      message: 'SOS response did not include an emergency record.',
    } satisfies ApiError;
  }
  return { ...record, rideId: record.rideId || rideId };
};

export const getRideSos = async (rideId: string): Promise<SosRecord | null> => {
  try {
    const payload = await httpClient.get<unknown>(ENDPOINTS.rides.sos(rideId));
    const record = unwrapSosRecord(payload);
    if (!record) {
      return null;
    }
    return { ...record, rideId: record.rideId || rideId };
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined;
    if (status === 404) {
      return null;
    }
    throw error;
  }
};

export const publishSosLocation = async (
  rideId: string,
  body: SosLocationRequest,
): Promise<void> => {
  await httpClient.post(ENDPOINTS.rides.sosLocation(rideId), body);
};
