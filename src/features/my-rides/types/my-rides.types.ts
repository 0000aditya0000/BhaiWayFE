export type MyRidesTab = 'upcoming' | 'past';

/** How My Rides should render for the current product entry. */
export type MyRidesSurface = 'standard' | 'office-commute';

/** Role of the current user on a ride card (office commute can mix both). */
export type MyRidesRideRole = 'rider' | 'driver';

/** Driver outstation publish kind used across pickup → trip → earnings. */
export type DriverRideKind = 'regular' | 'assured' | 'commute';

export interface MyRidesCoordinate {
  latitude: number;
  longitude: number;
}

export interface UpcomingRidePeer {
  name: string;
  vehicleLabel: string;
  plateNumber: string;
  avatarUri: string;
  verified: boolean;
}

/** Confirmed rider on a driver-published upcoming ride. */
export interface UpcomingRideRider {
  id: string;
  name: string;
  /** Optional workplace / note under the name. */
  subtitle?: string;
  /** Seats this rider booked (one rider can book multiple seats). */
  seatsBooked: number;
  avatarUri: string;
  verified: boolean;
}

/** @deprecated Use UpcomingRidePeer */
export type UpcomingRideDriver = UpcomingRidePeer;

export interface UpcomingRideSummary {
  id: string;
  /** Backend booking UUID when this card is a passenger booking. */
  bookingId?: string;
  /** Backend ride UUID (driver cards use id; passenger cards set this from booking.rideId). */
  rideId?: string;
  /** Backend ride status when known (PUBLISHED | IN_PROGRESS | …). */
  rideStatus?: string;
  dateLabel: string;
  title: string;
  assured: boolean;
  otp: string;
  pickupLabel: string;
  dropoffLabel: string;
  /** Real coordinates only — null when unknown (never invent Delhi/Noida placeholders). */
  pickup: MyRidesCoordinate | null;
  dropoff: MyRidesCoordinate | null;
  /** @deprecated Prefer live MapView route from pickup/dropoff */
  mapImageUri?: string;
  /** Driver when riding; lead passenger when driving. */
  peer: UpcomingRidePeer;
  /** @deprecated Prefer peer */
  driver: UpcomingRidePeer;
  /** Driver mode: confirmed riders shown under "Your Riders". */
  riders?: readonly UpcomingRideRider[];
  /**
   * Explicit card role. Used by office-commute My Rides to mix rider + driver cards.
   * When omitted, My Rides falls back to the global app mode.
   */
  role?: MyRidesRideRole;
  seatsBooked?: number;
  fareTotal?: number;
  paymentStatus?: string;
  bookingStatus?: string;
  /** Authoritative seat counts from GET /rides/my (driver cards). */
  totalSeats?: number;
  availableSeats?: number;
  /** Vehicle make/model when resolved from garage or booking snapshot. */
  vehicleLabel?: string;
  /** Active passenger booking count for this ride. */
  bookingCount?: number;
  /** Daily office commute — distinct from Regular/Assured outstation. */
  commute?: boolean;
  /** COMMUTE series id when this card is a generated occurrence. */
  seriesId?: string | null;
  occurrenceDate?: string | null;
  direction?: 'OUTBOUND' | 'RETURN' | null;
  /** Pending COMMUTE booking requests awaiting driver action. */
  pendingRequestCount?: number;
  /** Local departure ms for list sort. Missing/invalid values sort last. */
  sortAtMs?: number | null;
}


export interface HistoryRideItem {
  id: string;
  /** Passenger booking UUID when role is rider. */
  bookingId?: string;
  /** Backend ride UUID when role is driver. */
  rideId?: string;
  title: string;
  routeLabel: string;
  dateLabel: string;
  timeLabel?: string;
  statusLabel: string;
  /** Raw backend status (COMPLETED | CANCELLED). */
  status?: string;
  pickupLabel: string;
  dropoffLabel: string;
  /** Real coordinates only — null when unknown. */
  pickup: MyRidesCoordinate | null;
  dropoff: MyRidesCoordinate | null;
  /** Used by office-commute My Rides to decide invoice vs driver trip details. */
  role?: MyRidesRideRole;
  assured?: boolean;
  passengerCount?: number | null;
  vehicleLabel?: string;
  plateNumber?: string;
  earningsLabel?: string;
  cancelledAtLabel?: string;
  /** Daily office commute — distinct from Regular/Assured outstation. */
  commute?: boolean;
  /** COMMUTE series occurrence direction when the backend includes it. */
  direction?: 'OUTBOUND' | 'RETURN' | null;
  seriesId?: string | null;
  occurrenceDate?: string | null;
  /** Completion/end ms for list sort. Missing/invalid values sort last. */
  sortAtMs?: number | null;
}

/** @deprecated Prefer UpcomingRideSummary — kept for any residual imports. */
export type ActiveRideSummary = UpcomingRideSummary;
