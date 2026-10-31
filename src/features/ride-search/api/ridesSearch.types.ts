import type { BookingCoPassengerSnapshotDto } from './bookings.types';

/** Swagger: RideType */
export type ApiSearchRideType = 'REGULAR' | 'ASSURED' | 'COMMUTE';

export interface RideSearchDriverRatingDto {
  averageRating: number | string;
  totalRatings: number | string;
}

export interface RideSearchDriverRecentRideDto {
  id: string;
  /** Civil YYYY-MM-DD */
  date: string;
  source: string;
  destination: string;
  status: 'COMPLETED' | 'CANCELLED' | string;
}

export interface RideSearchDriverDto {
  id: string;
  displayName: string;
  /** Preferred photo field. Runtime payloads may send a Cloudinary object instead of a string. */
  profilePhoto?: string | null;
  /** Aliases used by some public/search/booking snapshots. */
  profilePicture?: string | null;
  photo?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  /**
   * As-driver averages from backend.
   * Prefer nested `{ averageRating, totalRatings }`; legacy flat number still accepted.
   */
  rating?: RideSearchDriverRatingDto | number | string | null;
  averageRating?: number | string | null;
  totalRatings?: number | string | null;
  /** Last 5 COMPLETED / CANCELLED rides, newest first. */
  recentRides?: readonly RideSearchDriverRecentRideDto[] | null;
  /** Corporate / identity verification flags from backend. */
  verified?: boolean | null;
  isCorporateVerified?: boolean | null;
  corporateVerified?: boolean | null;
  company?: string | null;
  organization?: string | null;
}

export interface RideSearchVehicleDto {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  variant?: string | null;
  color?: string | null;
  seatingCapacity: number;
}

export interface RideSearchPreferencesDto {
  maxTwoInBackSeat: boolean;
  noSmoking: boolean;
  noPets: boolean;
  luggageAllowed: boolean;
  /** Nested Women Only flag when backend places it under preferences. */
  womenOnly?: boolean;
}

/** Swagger: RideSearchItemDto */
export interface RideSearchItemDto {
  id: string;
  rideType: ApiSearchRideType;
  /** Present when backend exposes lifecycle status on public/search payloads. */
  status?: string | null;
  /** Present when backend exposes bookability separately from status. */
  isBookable?: boolean | null;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  /** Backend may send integer string, decimal string ("100.00"), or number. */
  pricePerSeat: string | number;
  /** Commute rider-facing fare per seat (driver fare + margin). Prefer for passenger UI. */
  riderPricePerSeat?: string | number | null;
  /** Assured rider security deposit when exposed by backend (prefer over percentage). */
  securityDepositAmount?: string | number | null;
  /** Assured rider deposit percentage when amount is absent / computed client-side. */
  securityDepositPercentage?: string | number | null;
  /** Ride-entity aliases (same values as securityDeposit*) — some public/search
   * payloads mirror the driver RideResponseDto naming.
   */
  assuredDepositAmount?: string | number | null;
  assuredDepositPercentage?: string | number | null;
  /** PREVIOUS_ASSURED_CANCELLATION when deposit is elevated after a prior cancel. */
  securityDepositReason?: string | null;
  preferences?: RideSearchPreferencesDto;
  /** Top-level preference mirrors when public/search payloads omit nested preferences. */
  maxTwoInBackSeat?: boolean | null;
  noSmoking?: boolean | null;
  noPets?: boolean | null;
  luggageAllowed?: boolean | null;
  /** Women Only — top-level when backend exposes it on search/public payloads. */
  womenOnly?: boolean | null;
  notes?: string | null;
  /** Corridor / route match score (0–100) when backend exposes it. */
  routeMatchPercent?: number | string | null;
  /** Commute search: backend field name for corridor overlap %. */
  routeMatchPercentage?: number | string | null;
  route_match_percentage?: number | string | null;
  matchPercent?: number | string | null;
  matchScore?: number | string | null;
  organization?: string | null;
  company?: string | null;
  driver: RideSearchDriverDto;
  vehicle: RideSearchVehicleDto;
  /** Published ride endpoints when backend exposes them on search/public payloads. */
  sourceLatitude?: number | string | null;
  sourceLongitude?: number | string | null;
  destinationLatitude?: number | string | null;
  destinationLongitude?: number | string | null;
  /** Other confirmed riders when backend exposes them on public ride detail. */
  coPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  passengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  bookedPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
}

/** Swagger: paginated search response */
export interface SearchRidesResponseDto {
  items: RideSearchItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Optional per-ride match map when backend returns scores outside each item. */
  routeMatchByRideId?: Record<string, number | string | null>;
  matchPercentByRideId?: Record<string, number | string | null>;
}

/**
 * Query params for GET /rides/search.
 * Client must not send driverId, status, or availableSeats.
 *
 * When pickup/dropoff coordinates are provided, the backend runs corridor
 * matching (bbox + ~50 km route proximity). Place names remain required.
 */
export interface SearchRidesQuery {
  source: string;
  destination: string;
  /** Civil/local date YYYY-MM-DD */
  date: string;
  time?: string;
  seats?: number;
  rideType?: ApiSearchRideType;
  page?: number;
  limit?: number;
  /** Passenger pickup latitude (corridor search). */
  pickupLatitude?: number;
  /** Passenger pickup longitude (corridor search). */
  pickupLongitude?: number;
  /** Passenger drop-off latitude (corridor search). */
  dropoffLatitude?: number;
  /** Passenger drop-off longitude (corridor search). */
  dropoffLongitude?: number;
}
