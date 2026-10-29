import type {
  ApiRideDirection,
  ApiRideStatus,
  ApiRideType,
  RideResponseDto,
} from './rides.types';

/** GET /rides/history — optional filter; default COMPLETED + CANCELLED. */
export type RideHistoryStatusFilter = 'COMPLETED' | 'CANCELLED';

export interface ListRideHistoryQuery {
  status?: RideHistoryStatusFilter;
  page?: number;
  limit?: number;
}

/** Vehicle snapshot on GET /rides/history and GET /rides/history/:id */
export interface RideHistoryVehicleDto {
  id?: string;
  vehicleType?: string | null;
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  color?: string | null;
  registrationNumber?: string | null;
  registrationYear?: number | null;
  seatingCapacity?: number | null;
  verified?: boolean | null;
  isVerified?: boolean | null;
}

/** Per-passenger earning line on history detail. */
export interface RideHistoryPassengerEarningDto {
  bookingId?: string;
  passengerId?: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePhoto?: string | null;
  seats?: number;
  /** Gross fare for the booking (completed booking fares). */
  fareAmount?: number | string | null;
  totalAmount?: number | string | null;
  /** Driver cut for this passenger when present. */
  driverShare?: number | string | null;
  driverShareAmount?: number | string | null;
  /** Platform / commute margin for this passenger when present. */
  platformShare?: number | string | null;
  bookingMode?: string | null;
}

/**
 * Driver earnings breakdown on GET /rides/history/:id.
 * Prefer nested `earnings`; flat aliases kept for older payloads.
 */
export interface RideHistoryEarningsDto {
  /** Completed booking fares (gross). */
  passengerTotal?: number | string | null;
  /** Driver cut (driverShareAmount or full fare). */
  driverShare?: number | string | null;
  driverShareAmount?: number | string | null;
  /** Commute margin when present. */
  platformShare?: number | string | null;
  /** Ledger Assured bonus when present. */
  assuredBonus?: number | string | null;
  /** Other ledger comps when present. */
  otherEarnings?: number | string | null;
  /** Net driver earnings. */
  total?: number | string | null;
}

/** List + detail item from GET /rides/history and GET /rides/history/:id */
export interface RideHistoryItemDto {
  id: string;
  rideType?: ApiRideType | string;
  status: ApiRideStatus | string;
  source: string;
  destination: string;
  departureDate?: string | null;
  departureTime?: string | null;
  /** Earliest pickup verification timestamp when available. */
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  /** COMMUTE series occurrence fields when the backend includes them. */
  seriesId?: string | null;
  occurrenceDate?: string | null;
  direction?: ApiRideDirection | string | null;
  passengerCount?: number | null;
  /** Legacy net earnings field — prefer `earnings.total`. */
  totalEarnings?: number | string | null;
  /** Legacy Assured bonus — prefer `earnings.assuredBonus`. */
  assuredBonus?: number | string | null;
  /** Flat earnings aliases when backend does not nest under `earnings`. */
  passengerTotal?: number | string | null;
  driverShare?: number | string | null;
  driverShareAmount?: number | string | null;
  platformShare?: number | string | null;
  otherEarnings?: number | string | null;
  total?: number | string | null;
  /** Nested earnings breakdown (preferred on detail). */
  earnings?: RideHistoryEarningsDto | null;
  /** From stored routeLengthMeters (null if no route geometry). */
  durationMinutes?: number | null;
  distanceKm?: number | null;
  sourceLatitude?: number | null;
  sourceLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  vehicle?: RideHistoryVehicleDto | null;
  passengers?: readonly RideHistoryPassengerEarningDto[] | null;
  /** Some backends may nest the ride DTO. */
  ride?: (RideResponseDto & {
    sourceLatitude?: number | null;
    sourceLongitude?: number | null;
    destinationLatitude?: number | null;
    destinationLongitude?: number | null;
    vehicle?: RideHistoryVehicleDto | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
  }) | null;
}

export interface RideHistoryPageDto {
  items?: RideHistoryItemDto[];
  rides?: RideHistoryItemDto[];
  data?: RideHistoryItemDto[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface RideHistoryPageResult {
  items: RideHistoryItemDto[];
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  hasMore: boolean;
}
