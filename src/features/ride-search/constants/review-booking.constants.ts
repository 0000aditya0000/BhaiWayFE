import type { ReviewBookingData, RideType } from '../types';
import { formatBhaiWayCoins } from '@/shared/utils';

export const REVIEW_BOOKING_SCREEN = {
  title: 'Review Booking',
  pickupLabel: 'PICKUP',
  dropoffLabel: 'DROP-OFF',
  editLabel: 'Edit',
  coPassengersLabel: 'CO-PASSENGERS',
  promoTitle: 'APPLY PROMO CODE',
  promoPlaceholder: 'Enter promo code',
  applyLabel: 'Apply',
  promoSuccess: 'Promo code BHAIWAY10 applied successfully!',
  assuredTitle: 'Assured Booking',
  assuredSubtitle: 'Security deposit (wallet hold)',
  assuredSelected: 'REQUIRED',
  assuredNote:
    'Note: You are booking an assured ride. The security deposit is held from your wallet and is separate from the ride fare. If you cancel, the deposit may not be refunded.',
  assuredPenaltyPreviousCancellationMessage: (percentage: number) =>
    `Your security deposit is ${percentage}% for this ride because you cancelled your previous Assured ride.`,
  assuredPenaltyNextBookingOnly:
    'This applies to your next Assured booking only.',
  fareTitle: 'FARE DETAILS',
  rideFareLabel: 'Ride Fare',
  platformFeeLabel: 'Platform Fee',
  promoDiscountLabel: 'Promo Discount',
  assuredFeeLabel: 'Security Deposit',
  totalLabel: 'Total Amount',
  seatsTitle: 'SEATS TO BOOK',
  confirmLabel: 'Confirm & Pay',
  confirmRegularLabel: 'Continue',
  loadingLabel: 'Loading ride details…',
  loadErrorTitle: 'Unable to load ride',
  loadErrorRetry: 'Retry',
  unavailableTitle: 'Ride unavailable',
  unavailableBody:
    'This Assured ride is no longer available to book. Please search again.',
} as const;

/** @deprecated Mock UI only — live Assured deposit comes from GET /rides/public/:id */
export const ASSURED_BOOKING_FEE = 50;
/** @deprecated UI mock only — production Assured deposit comes from GET /rides/public/:id */
export const DEFAULT_PROMO_CODE = 'BHAIWAY10';
export const DEFAULT_PROMO_DISCOUNT = 24;

const BASE_MOCK: Omit<ReviewBookingData, 'rideId' | 'rideType' | 'coPassengers' | 'fare'> = {
  pickup: {
    label: 'PICKUP',
    address: 'Tech Park South Gate, Sector 5',
    latitude: 12.9352,
    longitude: 77.6245,
  },
  dropoff: {
    label: 'DROP-OFF',
    address: 'Central Business District, Tower A',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  distanceLabel: '12.4 km',
  durationLabel: '24 mins',
  driver: {
    id: 'driver-booking-1',
    name: 'Arjun Sharma',
    subtitle: 'Altus Mindstream',
    rating: 4.9,
    totalRides: 1240,
  },
  maxPassengers: 4,
  promoCode: '',
};

const REGULAR_PASSENGERS = [
  { id: 'cp-1', name: 'Rohan M.', company: 'Google', verified: true },
  { id: 'cp-2', name: 'Priya S.', company: 'Microsoft', verified: true },
];

const ASSURED_PASSENGERS = [
  ...REGULAR_PASSENGERS,
  { id: 'cp-3', name: 'Karan D.', company: 'Amazon', verified: true },
];

const buildFare = (rideType: RideType): ReviewBookingData['fare'] => {
  const rideFare = 240;
  // Regular rides: no platform fee. Assured mock keeps legacy fee for UI continuity.
  const platformFee = rideType === 'assured' ? 15 : 0;
  const promoDiscount = 0;
  const assuredFee = 0;

  return {
    rideFare,
    platformFee,
    promoDiscount,
    assuredFee,
    total: rideFare + platformFee + assuredFee - promoDiscount,
  };
};

export const getReviewBookingMock = (
  rideId: string,
  rideType: RideType,
): ReviewBookingData => ({
  rideId,
  rideType,
  ...BASE_MOCK,
  coPassengers: rideType === 'assured' ? ASSURED_PASSENGERS : REGULAR_PASSENGERS,
  fare: buildFare(rideType),
});

export const formatBookingAmount = (value: number): string =>
  formatBhaiWayCoins(value, { spaced: false, minimumFractionDigits: 2 });

export const getReviewBookingPath = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  /** pricePerSeat from search — not total fare */
  price?: number;
  seats?: number;
  availableSeats?: number;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/ride-search/review-booking' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    price: params.price != null ? String(params.price) : '',
    seats: params.seats != null ? String(params.seats) : '',
    availableSeats: params.availableSeats != null ? String(params.availableSeats) : '',
    dateLabel: params.dateLabel ?? '',
    departureTime: params.departureTime ?? '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});
