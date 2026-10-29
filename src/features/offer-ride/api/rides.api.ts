import { ENDPOINTS, httpClient, type RequestConfig } from '@/network';

import type {
  ApiSeriesScope,
  CancelRideResultDto,
  CompleteRideResultDto,
  CreateRideDto,
  RideResponseDto,
  StartRideResultDto,
  UpdateRideDto,
} from './rides.types';

export type {
  ApiRideDirection,
  ApiRideSeriesStatus,
  ApiRideStatus,
  ApiRideType,
  ApiSeriesScope,
  ApiWeekday,
  AssuredRideLifecycleResponse,
  CancelRideResultDto,
  CommuteSeriesSummaryDto,
  CompleteRideResultDto,
  CreateRideDto,
  RideResponseDto,
  StartRideResultDto,
  UpdateRideDto,
} from './rides.types';

export { CREATE_RIDE_SEAT_LIMITS, SERIES_SCOPE, WOMEN_ONLY_BACKEND_FIELD } from './rides.types';
export { fetchRouteOptions, formatRouteOptionsPath } from './routeOptions.api';
export type {
  RequestRouteOptionsDto,
  RouteEndpoints,
  RouteOptionDto,
  RouteOptionsResponseDto,
  SelectDrivingRouteMode,
  SelectedDrivingRoute,
} from './routeOptions.types';

const unwrapRideList = (payload: unknown): RideResponseDto[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items as RideResponseDto[];
    }
    if (Array.isArray(record.rides)) {
      return record.rides as RideResponseDto[];
    }
    if (Array.isArray(record.data)) {
      return record.data as RideResponseDto[];
    }
  }
  return [];
};

export interface CreateRideOptions {
  /**
   * Required for ASSURED and for COMMUTE recurring/return-enabled publishes.
   * Reuse the same key when retrying one logical publish attempt.
   */
  idempotencyKey?: string;
}

export interface CancelRideOptions {
  /** COMMUTE series only. Omit for non-series rides. */
  seriesScope?: ApiSeriesScope;
}

/**
 * Publishes a ride for the authenticated driver.
 * Docs: POST /rides — 201 RideResponseDto
 * Regular: no Idempotency-Key. Assured: Idempotency-Key required.
 * COMMUTE recurring or returnEnabled: Idempotency-Key required.
 */
export const createRide = (
  payload: CreateRideDto,
  options?: CreateRideOptions,
): Promise<RideResponseDto> => {
  const idempotencyKey = options?.idempotencyKey?.trim();
  return httpClient.post<RideResponseDto>(ENDPOINTS.rides.create, payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
};

/**
 * Lists rides owned by the authenticated driver.
 * Docs: GET /rides/my
 */
export const listMyRides = async (): Promise<RideResponseDto[]> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.rides.my);
  return unwrapRideList(payload);
};

/**
 * Cancels an owned ride before departure (driver only).
 * Docs: POST /rides/:id/cancel — empty body; JWT identifies the owning driver.
 * COMMUTE series: optional `seriesScope` query (THIS_OCCURRENCE | THIS_AND_FUTURE).
 */
export const cancelRideById = (
  id: string,
  options?: CancelRideOptions,
): Promise<CancelRideResultDto> =>
  httpClient.post<CancelRideResultDto>(formatCancelRidePath(id, options?.seriesScope), undefined);

/** Pure path helper for tests. */
export const formatCancelRidePath = (
  id: string,
  seriesScope?: ApiSeriesScope,
): string => {
  const path = ENDPOINTS.rides.cancel(id);
  if (!seriesScope) {
    return path;
  }
  return `${path}?seriesScope=${encodeURIComponent(seriesScope)}`;
};

/**
 * Owner-only ride detail.
 * Docs: GET /rides/:id
 */
export const getRideById = (id: string): Promise<RideResponseDto> =>
  httpClient.get<RideResponseDto>(ENDPOINTS.rides.byId(id));

/**
 * Updates an owned ride.
 * Docs: PATCH /rides/:id — owning driver only.
 * Client must not send driverId, status, availableSeats, or bookedSeats.
 * With active bookings: send `{ totalSeats }` only (or protected fields unchanged).
 */
export const updateRideById = (
  id: string,
  payload: UpdateRideDto,
): Promise<RideResponseDto> =>
  httpClient.patch<RideResponseDto>(ENDPOINTS.rides.byId(id), payload);

/** Pure path helper for tests. */
export const formatUpdateRidePath = (id: string): string => ENDPOINTS.rides.byId(id);

/**
 * Starts an owned ride (Regular or Assured).
 * Docs: POST /rides/:id/start — empty body; JWT identifies the owning driver.
 * Effect: transitions ride to IN_PROGRESS per backend rules.
 */
export const startRideById = (id: string): Promise<StartRideResultDto> =>
  httpClient.post<StartRideResultDto>(ENDPOINTS.rides.start(id), undefined);

/** Pure path helper for tests. */
export const formatStartRidePath = (id: string): string => ENDPOINTS.rides.start(id);

/**
 * Completes an owned ride.
 * Docs: POST /rides/:id/complete — empty body; JWT identifies the owning driver.
 * Regular: IN_PROGRESS → COMPLETED when all active passengers are PICKED_UP.
 * Assured completion can exceed the default API timeout (settlement / deposits);
 * callers may pass a longer `timeoutMs` and should reconcile via GET /rides/:id
 * on timeout / conflict.
 */
export const completeRideById = (
  id: string,
  config?: RequestConfig,
): Promise<CompleteRideResultDto> =>
  httpClient.post<CompleteRideResultDto>(ENDPOINTS.rides.complete(id), undefined, config);
/** Pure path helper for tests. */
export const formatCompleteRidePath = (id: string): string => ENDPOINTS.rides.complete(id);
