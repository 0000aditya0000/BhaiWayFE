import type { DriverRecentRideStatusItem } from '../constants/driver-recent-rides.constants';

export type RideResultFilterId = 'regular' | 'assured';

export type RideResultSortId =
  | 'price-asc'
  | 'price-desc'
  | 'departure'
  | 'rating'
  | 'duration';

export type RideType = 'regular' | 'assured';

export type SeatUrgency = 'available' | 'limited' | 'last';

export interface RideDriver {
  id: string;
  name: string;
  rating: number;
  totalRatings: number;
  verified: boolean;
  avatarUri?: string;
  recentRides: readonly DriverRecentRideStatusItem[];
}

export interface RideVehicleSummary {
  id: string;
  label: string;
  color: string;
  vehicleType: string;
  seatingCapacity: number;
  make: string;
  model: string;
  variant: string;
}

export interface RidePreference {
  id: string;
  label: string;
  icon: string;
}

export interface RideFeature {
  id: string;
  label: string;
  icon: string;
}

export interface RideResultItem {
  id: string;
  rideType: RideType;
  driver: RideDriver;
  vehicle: RideVehicleSummary;
  price: number;
  originalPrice?: number;
  departureTime: string;
  carModel: string;
  seatsLeft: number;
  ac: boolean;
  luggage: string;
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  durationMinutes: number;
  durationLabel: string;
  preferences: RidePreference[];
  features: RideFeature[];
  /** Backend womenOnly (or preferences.womenOnly) for booking UX. */
  womenOnly?: boolean;
}

export interface RideSearchSummary {
  originCity: string;
  destinationCity: string;
  dateLabel: string;
  passengers: number;
  passengerLabel: string;
}

export interface RideResultFilterOption {
  id: RideResultFilterId;
  label: string;
}

export interface RideResultSortOption {
  id: RideResultSortId;
  label: string;
}
