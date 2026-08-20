/** Swagger: RideType */
export type ApiRideType = 'REGULAR' | 'ASSURED';

/** Swagger / docs ride status values. */
export type ApiRideStatus =
  | 'PUBLISHED'
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
  rideType: 'REGULAR';
  vehicleId: string;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  pricePerSeat: number;
  maxTwoInBackSeat: boolean;
  noSmoking: boolean;
  noPets: boolean;
  luggageAllowed: boolean;
  notes: string | null;
}

/**
 * Swagger: RideResponseDto
 * Docs: POST /rides (201), GET /rides/my, GET /rides/:id
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
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const CREATE_RIDE_SEAT_LIMITS = {
  min: 1,
  max: 8,
} as const;

/** Backend CreateRideDto has no women-only / gender-preference field. */
export const WOMEN_ONLY_BACKEND_FIELD = null;
