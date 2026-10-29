import type { RideResultItem } from '@/features/ride-search/types';

export interface CommuteRideResultItem extends Omit<RideResultItem, 'rideType'> {
  rideType: 'commute';
  vehicleColor: string;
  seatsNote: string;
  organization: string;
  /** Rider-facing fare per seat from backend. */
  riderPricePerSeat: number;
  availableSeats: number;
  departureDate: string;
  source: string;
  destination: string;
  pickupLabel: string;
  dropoffLabel: string;
  /** Driver rating from API — null when backend does not send it. */
  driverRating: number | null;
  /** Route match % from API — null when backend does not send it. */
  matchPercent: number | null;
  /** Confirmed co-passengers already on the ride. */
  coPassengerCount: number;
}

export interface CommuteSearchSummary {
  origin: string;
  destination: string;
  dateLabel: string;
  timeLabel: string;
  sameOrganizationOnly: boolean;
}

export type CommuteMatchFilterId = 'all' | 'high' | 'medium' | 'low';

export type CommuteResultSortId = 'match-desc' | 'price-asc' | 'departure';

export interface CommuteMatchFilterOption {
  id: CommuteMatchFilterId;
  label: string;
  hint?: string;
}

export interface CommuteResultSortOption {
  id: CommuteResultSortId;
  label: string;
}
