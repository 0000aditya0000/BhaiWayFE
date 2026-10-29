/** Swagger: RideType */
export type ApiRideType = 'REGULAR' | 'ASSURED' | 'COMMUTE';

/** Swagger: Weekday — COMMUTE excludeWeekdays values. */
export type ApiWeekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** Swagger: RideDirection — series-generated COMMUTE occurrence. */
export type ApiRideDirection = 'OUTBOUND' | 'RETURN';

/** Swagger: SeriesScope — COMMUTE series update/cancel. */
export type ApiSeriesScope = 'THIS_OCCURRENCE' | 'THIS_AND_FUTURE';

/** Swagger: RideSeriesStatus */
export type ApiRideSeriesStatus = 'ACTIVE' | 'CANCELLED';

/** Swagger / docs ride status values. */
export type ApiRideStatus =
  | 'PUBLISHED'
  | 'ASSURANCE_PENDING'
  | 'ASSURANCE_ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | string;

/**
 * Swagger: CreateRideDto
 * Docs: POST /rides — Authorization: Bearer <BHAIWAY_JWT>
 *
 * Client must not send driverId, status, or availableSeats.
 */
export interface CreateRideDto {
  rideType: ApiRideType;
  vehicleId: string;
  source: string;
  destination: string;
  /**
   * Signed token from POST /rides/route-options.
   * Required for REGULAR, ASSURED, and COMMUTE.
   */
  routeSelectionToken: string;
  /** Required — must match the selected route endpoints. */
  sourceLatitude: number;
  sourceLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  pricePerSeat: number;
  maxTwoInBackSeat: boolean;
  noSmoking: boolean;
  noPets: boolean;
  luggageAllowed: boolean;
  /** Women Only ride — REGULAR / ASSURED only. Default false. */
  womenOnly?: boolean;
  notes: string | null;
  /**
   * COMMUTE only. When true, backend generates occurrences for the publish date
   * plus the next six calendar dates (Asia/Kolkata). Omit for single-date rides.
   */
  recurring?: boolean;
  /** COMMUTE recurring only. ISO weekday names to skip inside the 7-day window. */
  excludeWeekdays?: ApiWeekday[];
  /**
   * COMMUTE only. Same-day reverse ride per eligible outbound date.
   * Omit when return is disabled.
   */
  returnEnabled?: boolean;
  /** Required when returnEnabled is true. HH:mm or HH:mm:ss; strictly after outbound. */
  returnDepartureTime?: string;
  /** Required when returnEnabled is true. Reverse-route token — never the outbound token. */
  returnRouteSelectionToken?: string;
  /** Optional return origin label. Defaults to swapping destination when omitted. */
  returnSource?: string;
  /** Optional return destination label. Defaults to swapping source when omitted. */
  returnDestination?: string;
}

/**
 * Partial update for an owned ride.
 * Docs: PATCH /rides/:id — owning driver only.
 *
 * Client must not send driverId, status, availableSeats, or bookedSeats.
 * availableSeats / booked seats are server-managed; client counts are ignored.
 *
 * After any active booking:
 * - Prefer `{ totalSeats }` only, or resend protected route/schedule/fare fields unchanged.
 * - Changing route/schedule/fare → expect 409.
 * - totalSeats below booked seats → expect 400.
 */
export interface UpdateRideDto {
  vehicleId?: string;
  source?: string;
  destination?: string;
  /** Required when changing source, destination, or endpoint coordinates. */
  routeSelectionToken?: string;
  sourceLatitude?: number;
  sourceLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  departureDate?: string;
  departureTime?: string;
  totalSeats?: number;
  pricePerSeat?: number;
  maxTwoInBackSeat?: boolean;
  noSmoking?: boolean;
  noPets?: boolean;
  luggageAllowed?: boolean;
  /** Editable only before the first booking (backend-enforced). */
  womenOnly?: boolean;
  notes?: string | null;
  /**
   * COMMUTE series only. THIS_OCCURRENCE updates this ride.
   * THIS_AND_FUTURE updates this ride and later same-direction occurrences.
   * Omit for non-series rides (backend rejects the field).
   */
  seriesScope?: ApiSeriesScope;
}

/**
 * Swagger: RideResponseDto
 * Docs: POST /rides (201), GET /rides/my, GET /rides/:id, PATCH /rides/:id
 */
export interface RideResponseDto {
  id: string;
  driverId: string;
  vehicleId: string;
  rideType: ApiRideType;
  status: ApiRideStatus;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  maxTwoInBackSeat: boolean;
  noSmoking: boolean;
  noPets: boolean;
  luggageAllowed: boolean;
  /** Women Only — only verified FEMALE riders may book when true. */
  womenOnly?: boolean;
  notes: string | null;
  /** Owner-only Assured driver deposit amount in points (null for Regular). */
  assuredDepositAmount?: string | null;
  assuredDepositPercentage?: number | null;
  /** Whether passengers can book this ride (separate from lifecycle status). */
  isBookable?: boolean;
  /** True when the stored geometry was explicitly selected by the driver. */
  routeSelected?: boolean;
  routeLengthMeters?: number | null;
  routeDurationSeconds?: number | null;
  createdAt?: string;
  updatedAt?: string;
  /** COMMUTE series id when this ride is an occurrence. Null for non-series rides. */
  seriesId?: string | null;
  /** Civil occurrence date (YYYY-MM-DD) for series rides. */
  occurrenceDate?: string | null;
  direction?: ApiRideDirection | null;
  isOriginalOccurrence?: boolean;
  /**
   * Present on commute series publish/owner responses.
   * Nested occurrence rows omit this to avoid recursion.
   */
  series?: CommuteSeriesSummaryDto | null;
}

/** Swagger: CommuteSeriesSummaryDto — owner publish/detail for a COMMUTE series. */
export interface CommuteSeriesSummaryDto {
  id: string;
  status: ApiRideSeriesStatus;
  startDate: string;
  endDate: string;
  excludedWeekdays: ApiWeekday[];
  returnEnabled: boolean;
  returnDepartureTime?: string | null;
  originalRideId?: string | null;
  occurrences: RideResponseDto[];
}

export const CREATE_RIDE_SEAT_LIMITS = {
  min: 1,
  max: 8,
} as const;

/** Create/Update/Search ride DTO field for Women Only. */
export const WOMEN_ONLY_BACKEND_FIELD = 'womenOnly' as const;

export const SERIES_SCOPE = {
  THIS_OCCURRENCE: 'THIS_OCCURRENCE',
  THIS_AND_FUTURE: 'THIS_AND_FUTURE',
} as const satisfies Record<ApiSeriesScope, ApiSeriesScope>;

/** Docs: GET /rides/my-active — JWT subject as driver or confirmed passenger. */
export type ApiActiveRideRole = 'DRIVER' | 'PASSENGER';

/**
 * Docs: GET /rides/my-active item.
 * Fares are integer-point snapshots from the backend (1 point = ₹1). Do not recompute.
 * OTP is passenger-only, existing pickup OTP, never generated here.
 */
export interface ActiveRideItemDto {
  rideId: string;
  role: ApiActiveRideRole | string;
  rideType: ApiRideType | string;
  status: 'IN_PROGRESS' | string;
  source: string;
  destination: string;
  bookingId?: string | null;
  fare?: string | number;
  otp?: string | null;
  totalPassengers?: number;
  totalFare?: string | number;
  seriesId?: string | null;
  occurrenceDate?: string | null;
  direction?: ApiRideDirection | string | null;
}

export interface ActiveRidesResponseDto {
  items: ActiveRideItemDto[];
}

/**
 * Docs: POST /rides/:id/cancel — Assured driver cancellation lifecycle response.
 * Backend is authoritative for all compensation fields; mobile must not compute them.
 */
export interface AssuredRideLifecycleResponse {
  rideId: string;
  status: string;
  cancellationReason: string;
  cancelledBookingCount: number;
  driverDepositForfeited: string;
  riderCompensationTotal: string;
  platformForfeiture: string;
  fareRefundedTotal: string;
  couponsIssuedCount: number;
  alreadyApplied: boolean;
}

/**
 * Docs: POST /rides/:id/cancel — owning driver only.
 * Request body is not documented; client sends none.
 * Regular rides may return a minimal payload; Assured rides include compensation fields.
 */
export type CancelRideResultDto = Partial<AssuredRideLifecycleResponse> & {
  id?: string;
  status?: ApiRideStatus;
  rideType?: ApiRideType;
  availableSeats?: number;
  totalSeats?: number;
  alreadyApplied?: boolean;
  /** COMMUTE THIS_AND_FUTURE: rides actually cancelled. */
  cancelledRideIds?: string[];
  /** COMMUTE THIS_AND_FUTURE: booked future occurrences left unchanged. */
  skippedBookedRideIds?: string[];
  /** COMMUTE THIS_AND_FUTURE: in-progress (or otherwise ineligible) occurrences left unchanged. */
  skippedIneligibleRideIds?: string[];
};

/**
 * Docs: POST /rides/:id/start — owning driver only.
 * Regular: PUBLISHED → IN_PROGRESS. Assured: backend-controlled transition.
 * Empty body. Response is authoritative RideResponseDto.
 */
export type StartRideResultDto = RideResponseDto;

/**
 * Docs: POST /rides/:id/complete — owning driver only.
 * Regular: IN_PROGRESS → COMPLETED only when all active passengers are PICKED_UP.
 * Cancelled bookings are ignored. Empty body.
 */
export interface CompleteRideResultDto {
  id?: string;
  status?: ApiRideStatus;
  rideType?: ApiRideType;
  availableSeats?: number;
  totalSeats?: number;
  alreadyApplied?: boolean;
}
