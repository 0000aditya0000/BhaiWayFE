import { ENDPOINTS, httpClient } from '@/network';

import { normalizeNoShowClaim } from '../utils/noShow.mapper';
import type { NoShowClaimDto } from './noShow.types';

const requireClaim = (payload: unknown, fallback: string): NoShowClaimDto => {
  const claim = normalizeNoShowClaim(payload);
  if (!claim) {
    throw new Error(fallback);
  }
  return claim;
};

/** POST /rides/:id/no-show/driver — empty body; JWT identifies the passenger. */
export const reportDriverNoShow = async (rideId: string): Promise<NoShowClaimDto> => {
  const trimmed = rideId.trim();
  if (!trimmed) {
    throw new Error('Missing ride id');
  }
  const payload = await httpClient.post<unknown>(ENDPOINTS.rides.driverNoShow(trimmed));
  return requireClaim(payload, 'Invalid driver no-show response');
};

/** POST /bookings/:id/no-show/passenger — empty body; JWT identifies the driver. */
export const reportPassengerNoShow = async (bookingId: string): Promise<NoShowClaimDto> => {
  const trimmed = bookingId.trim();
  if (!trimmed) {
    throw new Error('Missing booking id');
  }
  const payload = await httpClient.post<unknown>(
    ENDPOINTS.bookings.passengerNoShow(trimmed),
  );
  return requireClaim(payload, 'Invalid passenger no-show response');
};

/** GET /no-show-claims/:id */
export const getNoShowClaim = async (claimId: string): Promise<NoShowClaimDto> => {
  const trimmed = claimId.trim();
  if (!trimmed) {
    throw new Error('Missing claim id');
  }
  const payload = await httpClient.get<unknown>(ENDPOINTS.noShowClaims.byId(trimmed));
  return requireClaim(payload, 'Invalid no-show claim response');
};

/** POST /no-show-claims/:id/approve — empty body; respondent only. */
export const approveNoShowClaim = async (claimId: string): Promise<NoShowClaimDto> => {
  const trimmed = claimId.trim();
  if (!trimmed) {
    throw new Error('Missing claim id');
  }
  const payload = await httpClient.post<unknown>(ENDPOINTS.noShowClaims.approve(trimmed));
  return requireClaim(payload, 'Invalid approve-claim response');
};

/** POST /no-show-claims/:id/reject — empty body; respondent only. */
export const rejectNoShowClaim = async (claimId: string): Promise<NoShowClaimDto> => {
  const trimmed = claimId.trim();
  if (!trimmed) {
    throw new Error('Missing claim id');
  }
  const payload = await httpClient.post<unknown>(ENDPOINTS.noShowClaims.reject(trimmed));
  return requireClaim(payload, 'Invalid reject-claim response');
};
