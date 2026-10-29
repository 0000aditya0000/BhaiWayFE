import type {
  TripCompletedData,
  TripCompletedFareLine,
  TripCompletedPaymentOption,
  RideType,
} from '../types';
import { DEFAULT_MAP_COORDINATE } from './ride-search.constants';
import { formatBhaiWayCoins } from '@/shared/utils';

export const TRIP_COMPLETED_SCREEN = {
  heading: 'Trip Completed!',
  subtitle: "Thank you for riding with BhaiWay. Here's your journey overview.",
  summaryLabel: 'Trip Summary',
  statusLabel: 'COMPLETED',
  pickupLabel: 'PICKUP',
  destinationLabel: 'DESTINATION',
  driverLabel: 'DRIVER',
  amountLabel: 'AMOUNT TO PAY',
  rideFareLabel: 'Ride fare',
  assuredDepositLabel: 'Assured security deposit',
  assuredDepositNote: 'Already handled separately',
  paymentTitle: 'Payment Method',
  walletOptionLabel: 'BhaiWay Wallet',
  cashOptionLabel: 'Pay in Cash',
  walletAvailablePrefix: 'Available:',
  payCta: 'Pay Now & Rate Driver',
  processingLabel: 'Processing payment...',
  secureNote: 'Secure transaction processed by BhaiWay Pay',
  paidTitle: 'Payment Successful',
  paidWalletMessage: 'paid from your\nBhaiWay Wallet',
  paidCashTitle: 'Payment Marked as Cash',
  paidCashMessage: 'Your ride fare has been marked\nas paid in cash.',
  paidFareMessage: 'Your ride fare has been paid.',
  paymentIdLabel: 'Payment ID',
  doneCta: 'Done',
  continueToRatingCta: 'Rate Driver',
  insufficientTitle: 'Insufficient Wallet Balance',
  insufficientAddMoneyCta: 'Add Money',
  insufficientPayCashCta: 'Pay in Cash',
  retryPaymentMessage: 'Payment could not be completed. Please try again.',
  alreadyPaidTitle: 'Fare Paid',
  alreadyPaidMessage: 'Your ride fare is already settled.',
} as const;

export const buildTripCompletedPaymentOptions = (walletAvailableLabel?: string | null) =>
  [
    {
      id: 'wallet' as const,
      label: TRIP_COMPLETED_SCREEN.walletOptionLabel,
      subtitle: walletAvailableLabel
        ? `${TRIP_COMPLETED_SCREEN.walletAvailablePrefix} ${walletAvailableLabel}`
        : 'Pay from your BhaiWay Wallet',
      icon: 'wallet' as const,
    },
    {
      id: 'cash' as const,
      label: TRIP_COMPLETED_SCREEN.cashOptionLabel,
      subtitle: 'Settle the fare directly with your driver',
      icon: 'cash' as const,
    },
  ] as const;

/** @deprecated Use buildTripCompletedPaymentOptions — kept for type compatibility. */
export const TRIP_COMPLETED_PAYMENT_OPTIONS = buildTripCompletedPaymentOptions();

export const getTripCompletedMock = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  dateLabel?: string;
  distanceLabel?: string;
  fareLines?: TripCompletedFareLine[];
}): TripCompletedData => {
  const total = params.price != null && Number.isFinite(params.price) ? params.price : 240;
  const pickupTitle = shortName(params.origin) || 'Saket';
  const dropoffTitle = shortName(params.destination) || 'Cyber City';
  const driver = params.driverName || 'Rajesh Kumar';
  const car = params.carModel || 'Swift Dzire';

  return {
    rideId: params.rideId,
    rideType: params.rideType,
    dateLabel: params.dateLabel?.trim() || '—',
    statusLabel: TRIP_COMPLETED_SCREEN.statusLabel,
    pickupTitle,
    pickupAddress: params.origin?.includes(',')
      ? params.origin
      : 'Metro Station Gate 2, New Delhi',
    dropoffTitle,
    dropoffAddress: params.destination?.includes(',')
      ? params.destination
      : 'DLF Phase 3, Gurugram',
    driverName: driver,
    driverMeta: `4.9 • ${car} (DL 1C AB 1234)`,
    amountLabel: formatBhaiWayCoins(Math.round(total), { spaced: false }),
    totalAmount: total,
    distanceLabel: params.distanceLabel?.trim() || '—',
    fareLines: params.fareLines ?? [
      {
        label: 'Trip fare',
        amountLabel: formatBhaiWayCoins(Math.round(total), { spaced: false }),
      },
    ],
    pickup: {
      latitude: params.originLat ?? DEFAULT_MAP_COORDINATE.latitude,
      longitude: params.originLng ?? DEFAULT_MAP_COORDINATE.longitude,
    },
    dropoff: {
      latitude: params.destinationLat ?? DEFAULT_MAP_COORDINATE.latitude + 0.04,
      longitude: params.destinationLng ?? DEFAULT_MAP_COORDINATE.longitude - 0.06,
    },
  };
};

export const getTripCompletedPath = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  bookingId?: string;
}) => ({
  pathname: '/ride-search/trip-completed' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
    bookingId: params.bookingId ?? '',
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    price: params.price != null ? String(params.price) : '',
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
