import type { CommuteReviewBookingData } from '../types/commute-review-booking.types';
import { formatBhaiWayCoins } from '@/shared/utils';

export const COMMUTE_REVIEW_BOOKING_SCREEN = {
  title: 'Review Booking',
  subtitle: 'Confirm your commute request before payment.',
  distanceLabel: 'Distance',
  etaLabel: 'Departure',
  matchCaption: 'Route overlap',
  routeMatchLabel: (percent: number) => `Route match ${percent}%`,
  rideAlongsTitle: 'Ride Alongs',
  rideAlongsCount: (count: number) =>
    count === 1 ? '1 co-passenger' : `${count} co-passengers`,
  paymentTitle: 'Payment Summary',
  seatsLabel: 'Seats',
  perSeatLabel: 'Fare per seat',
  totalLabel: 'Total payable now',
  seatsAvailableHint: (max: number) =>
    max === 1 ? '1 seat available on this ride' : `Up to ${max} seats available`,
  payNowNote: 'Commute rides are paid upfront. Your request stays pending until the driver accepts.',
  confirmLabel: 'Continue to Payment',
  confirmingLabel: 'Loading...',
  loadErrorTitle: 'Unable to load ride',
  retryLabel: 'Try again',
} as const;

const DEFAULT_PICKUP = {
  label: 'Cyber City',
  address: 'DLF Cyber City, Gurugram',
  latitude: 28.4949,
  longitude: 77.0881,
};

const DEFAULT_DROPOFF = {
  label: 'Noida Sector 62',
  address: 'Sector 62, Noida',
  latitude: 28.6274,
  longitude: 77.3649,
};

export const getCommuteReviewBookingMock = (overrides?: {
  rideId?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  origin?: string;
  destination?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}): CommuteReviewBookingData => {
  const riderPricePerSeat = overrides?.price ?? 110;
  const seats = 1;
  const total = riderPricePerSeat * seats;

  return {
    rideId: overrides?.rideId ?? 'commute-ride-1',
    driverName: overrides?.driverName ?? 'Arjun Sharma',
    carModel: overrides?.carModel ?? 'Honda City',
    distanceLabel: '12.4 km',
    durationLabel: '24 mins',
    matchPercent: 95,
    matchCaption: COMMUTE_REVIEW_BOOKING_SCREEN.matchCaption,
    riderPricePerSeat,
    availableSeats: 3,
    pickup: {
      ...DEFAULT_PICKUP,
      label: overrides?.origin?.trim() || DEFAULT_PICKUP.label,
      latitude: overrides?.originLat ?? DEFAULT_PICKUP.latitude,
      longitude: overrides?.originLng ?? DEFAULT_PICKUP.longitude,
    },
    dropoff: {
      ...DEFAULT_DROPOFF,
      label: overrides?.destination?.trim() || DEFAULT_DROPOFF.label,
      latitude: overrides?.destinationLat ?? DEFAULT_DROPOFF.latitude,
      longitude: overrides?.destinationLng ?? DEFAULT_DROPOFF.longitude,
    },
    rideAlongs: [
      {
        id: 'along-1',
        name: 'Arjun S.',
        rating: 4.9,
        verificationLabel: 'Google Verified',
        seatLabel: 'Front Seat',
        verified: true,
        avatarUri:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBm3yno7XB8Q1vugR_jLzMzp8YUSj8rTtlY7S4X8HibIvLtTHuR_TbdUdXsPSJ09g0ttsDUtuk4u7SqMta2j_mSiYpeHubK2xADTatCtcnlHDmSWsPueqnzDaewGwYy5NC-ymntUpC-MHd8d671oc94V60mVLrtZq7RGSTbzvG667KpeZVcmqT7IGxS4lAG1AhwZRoZiaAcgsxiEvgQS-n4EXuiH7T_G5yPibCRDAOUdyjQgHbiwnYzaOL9n0RpwjzjMNc4L1BPS38',
      },
      {
        id: 'along-2',
        name: 'Priya V.',
        rating: 4.8,
        verificationLabel: 'Microsoft Verified',
        seatLabel: 'Rear Seat',
        verified: true,
        avatarUri:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAmHFC6kOkF_UdsgDe2I9Ao86aqthto4CkKgimCIzIul9wenFhRhOwf7mXqGfpV5z4z4PnQ5tMmQwziftJSxKLJ-Y9AgQ-p4M1bmdrR_oD6hGqsu_1vP450Z-ZRo8y8hi2J6w_sjAkzr22JgRiAu0ugno7JDHVuvbPrmyQeZwe5Qh0afjSm7DSO9PEQvC2s46H3cLcoKaaRp5FD-T5_cJqbV0HE_x-NqTly7NctMM9lTXzVot7pNZwHnbmQqmyc08WA5mXadzVuyy8',
      },
    ],
    fare: {
      riderPricePerSeat,
      seats,
      total,
    },
  };
};

export const formatCommuteAmount = (value: number): string =>
  formatBhaiWayCoins(value, { spaced: false, minimumFractionDigits: 2 });

export const getCommuteReviewBookingPath = (params: {
  rideId: string;
  origin: string;
  destination: string;
  driverName: string;
  carModel: string;
  price: number;
  dateLabel?: string;
  departureTime?: string;
  matchPercent?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/office-commute/review-booking' as const,
  params: {
    rideId: params.rideId,
    origin: params.origin,
    destination: params.destination,
    driverName: params.driverName,
    carModel: params.carModel,
    price: String(params.price),
    dateLabel: params.dateLabel ?? '',
    departureTime: params.departureTime ?? '',
    matchPercent:
      params.matchPercent != null && Number.isFinite(params.matchPercent)
        ? String(params.matchPercent)
        : '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});
