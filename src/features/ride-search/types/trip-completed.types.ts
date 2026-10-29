import type { MapCoordinate } from './map.types';
import type { RideType } from './ride-result.types';
import type { PayLaterPaymentResponse } from '../api/bookings.types';

export type TripCompletedPaymentId = 'wallet' | 'cash';

export type TripCompletedPaymentPhase =
  | 'idle'
  | 'processing'
  | 'success'
  | 'insufficient';

export interface TripCompletedInsufficientBalance {
  requiredAmount?: string;
  requiredLabel?: string;
  availableBalance?: string;
  availableLabel?: string;
  message: string;
}

export type { PayLaterPaymentResponse };

export interface TripCompletedPaymentOption {
  id: TripCompletedPaymentId;
  label: string;
  subtitle: string;
  icon: 'wallet' | 'business' | 'cash';
}

export interface TripCompletedFareLine {
  label: string;
  amountLabel: string;
}

export interface TripCompletedData {
  rideId: string;
  rideType: RideType;
  dateLabel: string;
  statusLabel: string;
  pickupTitle: string;
  pickupAddress: string;
  dropoffTitle: string;
  dropoffAddress: string;
  driverName: string;
  driverMeta: string;
  amountLabel: string;
  totalAmount: number;
  distanceLabel: string;
  fareLines: TripCompletedFareLine[];
  pickup: MapCoordinate;
  dropoff: MapCoordinate;
}
