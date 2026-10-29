import type { MapLatLng } from '@/shared/maps';
import type { RideRule } from '@/features/ride-search/types';

export interface RiderBookedRideSummary {
  bookingId: string;
  rideId: string;
  listingId: string;
  rideType: 'regular' | 'assured' | 'commute';
  routeTitle: string;
  source: string;
  destination: string;
  dateLabel: string;
  departureTimeLabel: string;
  vehicleLabel: string;
  seatsBooked: number;
  fareTotal: number;
  paymentStatus: string;
  paymentMethodLabel: string;
  bookingStatus: string;
  /** Uppercase pickup lifecycle from the booking when the API provides it. */
  pickupStatus?: string;
  /** Uppercase ride status from the nested ride snapshot when present. */
  rideStatus?: string;
  securityDepositLabel?: string;
  pickupOtp?: string;
  pickup: MapLatLng | null;
  dropoff: MapLatLng | null;
  seatsTotal: number;
  seatsAvailable: number;
  /** Driver publish preferences from GET /rides/public/:id when available. */
  preferences: readonly RideRule[];
  womenOnly?: boolean;
}
