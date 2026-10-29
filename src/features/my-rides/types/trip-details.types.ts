import type { DriverRideKind } from './my-rides.types';

export type TripDetailsEarningsLineKind =
  | 'passenger'
  | 'bonus'
  | 'platform'
  | 'other'
  | 'meta';

export interface TripDetailsEarningsLine {
  id: string;
  name: string;
  initials: string;
  tag: string;
  amountLabel: string;
  kind: TripDetailsEarningsLineKind;
  /** Optional secondary fare label (e.g. gross fare when amount is driver share). */
  subtitle?: string;
}

export interface TripDetailsVehicle {
  name: string;
  plateNumber: string;
  verified?: boolean;
  vehicleType?: string;
  seatingCapacity?: number | null;
  registrationYear?: number | null;
}

export interface TripDetailsSummary {
  rideId: string;
  rideType: DriverRideKind;
  origin: string;
  destination: string;
  dateLabel: string;
  durationLabel: string;
  distanceLabel: string;
  statusLabel: string;
  vehicle: TripDetailsVehicle;
  earningsLines: readonly TripDetailsEarningsLine[];
  totalEarningsLabel: string;
  mapImageUri?: string;
  avatarUri: string;
  pickup: { latitude: number; longitude: number } | null;
  dropoff: { latitude: number; longitude: number } | null;
  cancelledAtLabel?: string;
  startedAtLabel?: string;
}
