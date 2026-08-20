/** Swagger: RideType */
export type ApiSearchRideType = 'REGULAR' | 'ASSURED';

export interface RideSearchDriverDto {
  id: string;
  displayName: string;
  profilePhoto?: string | null;
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
}

/** Swagger: RideSearchItemDto */
export interface RideSearchItemDto {
  id: string;
  rideType: ApiSearchRideType;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: string;
  preferences: RideSearchPreferencesDto;
  notes?: string | null;
  driver: RideSearchDriverDto;
  vehicle: RideSearchVehicleDto;
}

/** Swagger: paginated search response */
export interface SearchRidesResponseDto {
  items: RideSearchItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Query params for GET /rides/search.
 * Client must not send driverId, status, or availableSeats.
 */
export interface SearchRidesQuery {
  source: string;
  destination: string;
  /** Civil/local date YYYY-MM-DD */
  date: string;
  time?: string;
  seats?: number;
  rideType?: 'REGULAR';
  page?: number;
  limit?: number;
}
