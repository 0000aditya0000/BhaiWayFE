import type { MapCoordinate } from './map.types';
import type { RideType } from './ride-result.types';

export interface LiveTrackingDriver {
  name: string;
  vehicleLabel: string;
  plateNumber: string;
  rating: number;
  avatarUri?: string;
}

export interface LiveTrackingData {
  rideId: string;
  rideType: RideType;
  statusLabel: string;
  etaMinutes: number;
  /** Human-readable ETA, e.g. `7 hr 18 min`. */
  etaLabel: string;
  /** Remaining distance label, e.g. `12 km`. */
  distanceRemainingLabel: string;
  /** Fare shown after trip starts, e.g. `₹240`. */
  fareLabel: string;
  startOtp: string;
  driver: LiveTrackingDriver;
  driverPhone?: string | null;
  pickupLabel: string;
  pickupAddress: string;
  dropoffLabel: string;
  dropoffAddress: string;
  pickup: MapCoordinate;
  dropoff: MapCoordinate;
}
