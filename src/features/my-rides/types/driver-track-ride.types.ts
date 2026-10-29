export interface DriverTrackConfirmedPassenger {
  id: string;
  name: string;
  subtitle: string;
  verified: boolean;
  avatarUri: string;
  seatsBooked: number;
  /** Uppercase booking status from API (e.g. CONFIRMED). */
  bookingStatus?: string;
  /** Uppercase payment status from API (e.g. UNPAID). */
  paymentStatus?: string;
  /** Human label for payment method (e.g. Pay After Ride). */
  paymentMethodLabel?: string;
  /** Formatted booking createdAt when API provides it. */
  bookedAtLabel?: string;
  /** Fare from totalAmount — Regular has no platform fee. */
  fareTotal?: number;
  /** Real phone only when present on passenger snapshot. */
  phone?: string;
  callAvailable?: boolean;
  /** Backend conversation id when embedded on the booking. */
  conversationId?: string;
  chatAvailable?: boolean;
}

export interface DriverTrackPendingRequest {
  id: string;
  name: string;
  subtitle: string;
  /** Only when backend provides a rider rating — never fabricated. */
  rating?: number;
  /** Only when backend provides completed ride count — never fabricated. */
  ridesCount?: number;
  idVerified: boolean;
  avatarUri: string;
  seatsBooked: number;
  /** Rider-paid fare when available. */
  fareTotal?: number;
  fareLabel?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  routeLabel?: string;
  dateTimeLabel?: string;
  bookingId: string;
}

export interface CommutePendingRequestGroup {
  rideId: string;
  routeTitle: string;
  source: string;
  destination: string;
  dateLabel: string;
  departureTimeLabel: string;
  availableSeats?: number;
  totalSeats?: number;
  requests: readonly DriverTrackPendingRequest[];
}

export interface DriverTrackCoordinate {
  latitude: number;
  longitude: number;
}

export interface DriverTrackRideSummary {
  rideId: string;
  listingId: string;
  rideType: 'regular' | 'assured' | 'commute';
  routeTitle: string;
  source: string;
  destination: string;
  dateLabel: string;
  departureTimeLabel: string;
  vehicleLabel: string;
  seatsConfirmed: number;
  seatsAvailable: number;
  seatsTotal: number;
  bookingCount: number;
  securityDepositLabel?: string;
  /** Cached pickup coords when available — never invented placeholders. */
  pickup: DriverTrackCoordinate | null;
  /** Cached drop-off coords when available — never invented placeholders. */
  dropoff: DriverTrackCoordinate | null;
  confirmed: readonly DriverTrackConfirmedPassenger[];
  pending: readonly DriverTrackPendingRequest[];
}
