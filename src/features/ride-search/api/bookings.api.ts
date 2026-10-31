import { ENDPOINTS, httpClient } from '@/network';

import type {
  BookingResponseDto,
  CancelBookingResultDto,
  AcceptBookingResultDto,
  CreateBookingDto,
  DriverBookingPageDto,
  ListDriverBookingsQuery,
  ListMyBookingsResponse,
  PayLaterPaymentResponse,
  VerifyPickupDto,
  VerifyPickupResultDto,
} from './bookings.types';

export type {
  ApiAssuredFarePayment,
  ApiBookingMode,
  ApiBookingPaymentMethod,
  ApiBookingStatus,
  ApiPaymentStatus,
  ApiPickupStatus,
  ApiSecurityDepositStatus,
  BookingDriverSnapshotDto,
  BookingPassengerSnapshotDto,
  BookingResponseDto,
  BookingRideSnapshotDto,
  BookingVehicleSnapshotDto,
  CancelBookingResultDto,
  AcceptBookingResultDto,
  CreateBookingDto,
  ListDriverBookingsQuery,
  ListMyBookingsResponse,
  PayLaterInsufficientWalletDetails,
  PayLaterPaymentChannel,
  PayLaterPaymentResponse,
  VerifyPickupDto,
  VerifyPickupResultDto,
} from './bookings.types';

const unwrapBookingList = (payload: unknown): BookingResponseDto[] => {
  if (Array.isArray(payload)) {
    return payload as BookingResponseDto[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as ListMyBookingsResponse & DriverBookingPageDto;
    if (Array.isArray(record.items)) {
      return record.items;
    }
    if (Array.isArray(record.bookings)) {
      return record.bookings;
    }
    if (Array.isArray(record.data)) {
      return record.data;
    }
    if (Array.isArray(record.results)) {
      return record.results;
    }
  }
  return [];
};

const buildDriverBookingsPath = (query: ListDriverBookingsQuery = {}): string => {
  const params = new URLSearchParams();
  if (query.rideId?.trim()) {
    params.set('rideId', query.rideId.trim());
  }
  if (query.status?.trim()) {
    params.set('status', query.status.trim());
  }
  if (query.page != null && Number.isFinite(query.page)) {
    params.set('page', String(Math.max(1, Math.floor(query.page))));
  }
  if (query.limit != null && Number.isFinite(query.limit)) {
    params.set('limit', String(Math.max(1, Math.floor(query.limit))));
  }
  const qs = params.toString();
  return qs
    ? `${ENDPOINTS.bookings.driverMyRides}?${qs}`
    : ENDPOINTS.bookings.driverMyRides;
};

export interface CreateBookingOptions {
  /** Required for WALLET, PAY_NOW, and ASSURED_DEPOSIT — reuse the same key when retrying one attempt. */
  idempotencyKey?: string;
}

/**
 * Creates a passenger booking.
 * Docs: POST /bookings — Authorization: Bearer <BHAIWAY_JWT>
 * Regular: { rideId, seats, paymentMethod: "WALLET"|"PAY_AFTER_RIDE" } — never send farePayment or amounts.
 *   WALLET requires Idempotency-Key; reuse it on timeout retries of the same attempt.
 * Assured: { rideId, seats, paymentMethod: "ASSURED_DEPOSIT", farePayment?: "PAY_NOW"|"PAY_LATER" }
 *   + Idempotency-Key header. Missing farePayment → backend treats as PAY_LATER.
 */
export const createBooking = (
  payload: CreateBookingDto,
  options?: CreateBookingOptions,
): Promise<BookingResponseDto> => {
  const idempotencyKey = options?.idempotencyKey?.trim();
  return httpClient.post<BookingResponseDto>(ENDPOINTS.bookings.create, payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
};

/**
 * Lists bookings for the authenticated passenger.
 * Docs: GET /bookings/my
 */
export const listMyBookings = async (): Promise<BookingResponseDto[]> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.bookings.my);
  return unwrapBookingList(payload);
};

/**
 * Lists bookings for rides owned by the authenticated driver.
 * Docs: GET /bookings/driver/my-rides — never send driverId; JWT identifies driver.
 */
export const listDriverBookings = async (
  query: ListDriverBookingsQuery = {},
): Promise<BookingResponseDto[]> => {
  const payload = await httpClient.get<unknown>(buildDriverBookingsPath(query));
  return unwrapBookingList(payload);
};

/** Exposed for tests/diagnostics. */
export const formatListDriverBookingsPath = (
  query: ListDriverBookingsQuery = {},
): string => buildDriverBookingsPath(query);

const unwrapBookingRecord = (payload: unknown): BookingResponseDto => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload as BookingResponseDto;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id === 'string' && record.id.trim()) {
    return payload as BookingResponseDto;
  }
  for (const key of ['data', 'booking', 'item', 'result'] as const) {
    const nested = record[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const inner = nested as Record<string, unknown>;
      if (typeof inner.id === 'string' && inner.id.trim()) {
        return nested as BookingResponseDto;
      }
    }
  }
  return payload as BookingResponseDto;
};

/**
 * Returns an owned booking.
 * Docs: GET /bookings/:id
 */
export const getBookingById = async (id: string): Promise<BookingResponseDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.bookings.byId(id));
  return unwrapBookingRecord(payload);
};

/**
 * Cancels an eligible passenger booking.
 * Docs: POST /bookings/:id/cancel — empty body (no reason / seats / status).
 * Backend lifecycle reason is always RIDER_CANCELLED.
 */
export const cancelBookingById = (id: string): Promise<CancelBookingResultDto> =>
  httpClient.post<CancelBookingResultDto>(ENDPOINTS.bookings.cancel(id), undefined);

/** Pure path helper for tests — never appends query or body fields. */
export const formatCancelBookingPath = (id: string): string => ENDPOINTS.bookings.cancel(id);

/**
 * Driver verifies passenger pickup OTP.
 * Docs: POST /bookings/:id/verify-pickup — body { otp }.
 */
export const verifyPickupById = (
  id: string,
  payload: VerifyPickupDto,
): Promise<VerifyPickupResultDto> =>
  httpClient.post<VerifyPickupResultDto>(ENDPOINTS.bookings.verifyPickup(id), payload);

/** Pure path helper for tests. */
export const formatVerifyPickupPath = (id: string): string =>
  ENDPOINTS.bookings.verifyPickup(id);

/**
 * Driver accepts a pending Commute booking.
 * Docs: POST /bookings/:id/accept — no body; no additional wallet debit.
 */
export const acceptBookingById = (id: string): Promise<AcceptBookingResultDto> =>
  httpClient.post<AcceptBookingResultDto>(ENDPOINTS.bookings.accept(id), undefined);

/** Pure path helper for tests. */
export const formatAcceptBookingPath = (id: string): string =>
  ENDPOINTS.bookings.accept(id);

/**
 * Driver rejects a pending Commute booking — full rider refund.
 * Docs: POST /bookings/:id/reject — no body.
 */
export const rejectBookingById = (id: string): Promise<BookingResponseDto> =>
  httpClient.post<BookingResponseDto>(ENDPOINTS.bookings.reject(id), undefined);

/** Pure path helper for tests. */
export const formatRejectBookingPath = (id: string): string =>
  ENDPOINTS.bookings.reject(id);

/**
 * Passenger pays outstanding PAY_LATER fare from BhaiWay Wallet.
 * Docs: POST /bookings/:id/pay-wallet — empty body; booking id is sufficient.
 */
export const payBookingWithWallet = (id: string): Promise<PayLaterPaymentResponse> =>
  httpClient.post<PayLaterPaymentResponse>(ENDPOINTS.bookings.payWallet(id), undefined);

/** Pure path helper for tests. */
export const formatPayBookingWithWalletPath = (id: string): string =>
  ENDPOINTS.bookings.payWallet(id);

/**
 * Passenger marks outstanding PAY_LATER fare as paid in cash.
 * Docs: POST /bookings/:id/pay-cash — empty body; booking id is sufficient.
 */
export const payBookingWithCash = (id: string): Promise<PayLaterPaymentResponse> =>
  httpClient.post<PayLaterPaymentResponse>(ENDPOINTS.bookings.payCash(id), undefined);

/** Pure path helper for tests. */
export const formatPayBookingWithCashPath = (id: string): string =>
  ENDPOINTS.bookings.payCash(id);
