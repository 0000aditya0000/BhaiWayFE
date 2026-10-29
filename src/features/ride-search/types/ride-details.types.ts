import type { RideType } from './ride-result.types';
import type { CoPassenger } from './review-booking.types';
import type { DriverRecentRideStatusItem } from '../constants/driver-recent-rides.constants';

export type RideDetailsMode = 'preview' | 'booked';

export interface RideDetailsLocation {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface RideDetailsDriver {
  id: string;
  name: string;
  company: string;
  rating: number;
  totalRatings: number;
  verified: boolean;
  vehicleColor: string;
  vehicleModel: string;
  vehicleType: string;
  seatingCapacity: number;
  /** Not returned on passenger search/public vehicle payloads. */
  plateNumber?: string;
  avatarUri?: string;
  recentRides: readonly DriverRecentRideStatusItem[];
}

export interface RideDetailsFare {
  rideFare: number;
  total: number;
}

export interface RideRule {
  id: string;
  label: string;
  icon: 'ban' | 'snow' | 'time' | 'bag' | 'people' | 'musical-notes' | 'paw' | 'checkmark-circle';
}

export interface RideDetailsData {
  rideId: string;
  rideType: RideType;
  dateTimeLabel: string;
  pickup: RideDetailsLocation;
  dropoff: RideDetailsLocation;
  driver: RideDetailsDriver;
  coPassengers: CoPassenger[];
  maxPassengers: number;
  seatsLeft: number;
  fare: RideDetailsFare;
  rules: RideRule[];
  distanceLabel: string;
  durationLabel: string;
  /** Backend womenOnly for preview booking UX. */
  womenOnly?: boolean;
}
