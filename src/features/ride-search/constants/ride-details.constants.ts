import type { RideDetailsData, RideDetailsMode, RideRule, RideType } from '../types';
import { formatBhaiWayCoins } from '@/shared/utils';

export const RIDE_DETAILS_SCREEN = {
  title: 'Ride Details',
  pickupLabel: 'Pickup',
  dropoffLabel: 'Drop-off',
  coPassengersLabel: 'Co-Passengers',
  seatsLeftLabel: 'seat left',
  seatsLeftPluralLabel: 'seats left',
  fareTitle: 'Fare Details',
  rideFareLabel: 'Ride Fare',
  totalLabel: 'Total Amount',
  rulesTitle: 'Ride Preferences',
  rulesSubtitle: 'Preferences set by the driver for this ride.',
  rulesEmptyLabel: 'No special preferences for this ride.',
  bookLabel: 'Book Ride',
  contactDriverLabel: 'Contact Driver',
  cancelLabel: 'Cancel Ride',
  verifiedAtPrefix: 'Verified at',
  cancelConfirmTitle: 'Cancel Ride',
  cancelConfirmMessage: 'Are you sure you want to cancel this ride?',
  cancelConfirmAction: 'Yes, Cancel',
  keepRideAction: 'Keep Ride',
  previewFooterHint: 'Review fare and preferences, then book your seat.',
  assuredLabel: 'ASSURED',
  regularLabel: 'REGULAR',
  ratingsCountLabel: (count: number) =>
    count === 1 ? '1 rating' : `${count} ratings`,
  seatsCapacityLabel: (count: number) =>
    count > 0 ? `${count} seats` : '',
} as const;

/** Fallback only when live preferences have not loaded yet. */
export const DEFAULT_RIDE_RULES: readonly RideRule[] = [] as const;

/** Skeleton shell until GET /rides/public/:id hydrates real passenger-card data. */
export const getRideDetailsMock = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  price?: number;
  distanceLabel?: string;
  durationLabel?: string;
}): RideDetailsData => {
  const rideFare = params.price != null && params.price > 0 ? params.price : 0;
  const pickupTitle = shortName(params.origin) || 'Pickup';
  const dropoffTitle = shortName(params.destination) || 'Drop-off';

  return {
    rideId: params.rideId,
    rideType: params.rideType,
    dateTimeLabel: params.durationLabel || '',
    pickup: {
      title: pickupTitle,
      address: params.origin || '',
      latitude: params.originLat ?? 0,
      longitude: params.originLng ?? 0,
    },
    dropoff: {
      title: dropoffTitle,
      address: params.destination || '',
      latitude: params.destinationLat ?? 0,
      longitude: params.destinationLng ?? 0,
    },
    driver: {
      id: '',
      name: params.driverName || '',
      company: '',
      rating: 0,
      totalRatings: 0,
      verified: false,
      vehicleColor: '',
      vehicleModel: params.carModel || '',
      vehicleType: '',
      seatingCapacity: 0,
      recentRides: [],
    },
    coPassengers: [],
    maxPassengers: 0,
    seatsLeft: 0,
    fare: {
      rideFare,
      total: rideFare,
    },
    rules: [...DEFAULT_RIDE_RULES],
    distanceLabel: params.distanceLabel || '',
    durationLabel: params.durationLabel || '',
  };
};

export const formatRideDetailsAmount = (value: number): string =>
  formatBhaiWayCoins(value, { spaced: false, minimumFractionDigits: 2 });

export const getRideDetailsPath = (params: {
  rideId: string;
  rideType: RideType;
  mode?: RideDetailsMode;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  distanceLabel?: string;
  durationLabel?: string;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/ride-search/ride-details' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
    mode: params.mode ?? 'preview',
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    price: params.price != null ? String(params.price) : '',
    distanceLabel: params.distanceLabel ?? '',
    durationLabel: params.durationLabel ?? '',
    dateLabel: params.dateLabel ?? '',
    departureTime: params.departureTime ?? '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});

const shortName = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.split(',')[0]?.trim() || value;
};
