import type { DriverRideKind } from './my-rides.types';
import type { PassengerRatingValue } from './rate-passengers.types';

export interface DriverTripCompletedPassenger {
  id: string;
  name: string;
  avatarUri: string;
  /** Optional initials when avatar is empty (e.g. "RK"). */
  initials?: string;
  fareLabel: string;
  /** Compliment chips shown for this passenger. */
  complimentOptions: readonly string[];
}

export interface DriverTripCompletedFareLine {
  label: string;
  amountLabel: string;
  /** Emphasize bonus / incentive lines in primary color. */
  highlight?: boolean;
}

export interface DriverTripCompletedCoordinate {
  latitude: number;
  longitude: number;
}

export interface DriverTripCompletedSummary {
  rideId: string;
  rideType: DriverRideKind;
  dateLabel: string;
  statusLabel: string;
  pickupTitle: string;
  pickupAddress: string;
  dropoffTitle: string;
  dropoffAddress: string;
  /** Full label e.g. "12.4 km". */
  distanceLabel: string;
  /** Numeric distance for the stats tile. */
  distanceValueLabel: string;
  distanceUnitLabel: string;
  /** Numeric duration for the stats tile. */
  durationValueLabel: string;
  durationUnitLabel: string;
  earningsLabel: string;
  earningsAmount: number;
  rideFareLabel: string;
  assuredBonusLabel: string;
  hasAssuredBonus: boolean;
  driverAvatarUri: string;
  passengers: readonly DriverTripCompletedPassenger[];
  fareLines: readonly DriverTripCompletedFareLine[];
  pickup: DriverTripCompletedCoordinate;
  dropoff: DriverTripCompletedCoordinate;
}

export interface DriverPassengerReviewDraft {
  rating: PassengerRatingValue;
  compliments: string[];
  note: string;
}
