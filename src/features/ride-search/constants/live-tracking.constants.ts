import type { LiveTrackingData, RideType } from '../types';
import { DEFAULT_MAP_COORDINATE } from './ride-search.constants';

export const LIVE_TRACKING_SCREEN = {
  title: 'Live Tracking',
  etaLabel: 'Estimated Arrival',
  etaLabelArrival: 'Driver arriving',
  etaLabelTrip: 'Trip ETA',
  etaAwayLabel: (mins: number) => `${mins} mins away`,
  chatLabel: 'Chat',
  callLabel: 'Call',
  otpHint: 'Share this OTP when your driver arrives',
  whyOtpLabel: 'Why do I need this?',
  whyOtpTitle: 'Pickup OTP',
  whyOtpMessage:
    'Share this one-time code with your driver at pickup. The code stays visible after they tap Start Ride, and hides only after they verify it.',
  waitingTitle: "Ride hasn't started yet",
  waitingMessage: 'Please wait for your driver.',
  waitingBadge: 'Not started yet',
  shareTripLabel: 'Share Trip',
  shareTripHint: 'Live location',
  supportLabel: 'Support',
  supportHint: 'Help center',
  sosLabel: 'SOS',
  sosHint: 'Open emergency assistance',
  sosHeaderLabel: 'SOS',
  supportTitle: 'Support',
  supportMessage: 'Help center will be available soon.',
  shareTripMessage: (driverName: string, etaLabel: string, otp?: string) =>
    otp
      ? `I'm on a BhaiWay ride with ${driverName}. ETA ${etaLabel}. Start OTP: ${otp}`
      : `I'm on a BhaiWay ride with ${driverName}. ETA ${etaLabel}.`,
  defaultEtaMinutes: 4,
  /** Assured/demo fallback only — Regular rider OTP comes from GET /bookings/:id pickupOtp. */
  defaultOtp: '',
  defaultDriverName: 'Driver',
  defaultVehicle: 'Vehicle',
  defaultPlate: '',
  defaultRating: 4.8,
  tripDetailsTitle: 'Trip details',
  remainingLabel: 'Remaining',
  fareLabelTitle: 'Fare',
  etaAwayLabelFormatted: (label: string) => `${label} away`,
  connectionLabels: {
    CONNECTING: 'Connecting…',
    CONNECTED: 'Connected',
    RECONNECTING: 'Reconnecting…',
    OFFLINE: 'Offline — refreshing…',
    LIVE: 'Live',
    STALE: 'Location may be outdated',
    WAITING: 'Waiting for driver location…',
    UNAVAILABLE: 'Driver location temporarily unavailable',
    COMPLETED: 'Trip ended',
    ERROR: 'Connection issue',
  },
} as const;

export const getLiveTrackingMock = (params: {
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
}): LiveTrackingData => {
  const driverName =
    params.driverName?.trim() || LIVE_TRACKING_SCREEN.defaultDriverName;
  const car = stripVehicleColor(params.carModel) || LIVE_TRACKING_SCREEN.defaultVehicle;
  const plate = extractPlate(params.carModel) || LIVE_TRACKING_SCREEN.defaultPlate;
  const hasOriginCoords =
    params.originLat != null &&
    params.originLng != null &&
    Number.isFinite(params.originLat) &&
    Number.isFinite(params.originLng);
  const hasDestinationCoords =
    params.destinationLat != null &&
    params.destinationLng != null &&
    Number.isFinite(params.destinationLat) &&
    Number.isFinite(params.destinationLng);

  return {
    rideId: params.rideId,
    rideType: params.rideType,
    statusLabel: LIVE_TRACKING_SCREEN.etaLabel,
    etaMinutes: LIVE_TRACKING_SCREEN.defaultEtaMinutes,
    etaLabel: `${LIVE_TRACKING_SCREEN.defaultEtaMinutes} min`,
    distanceRemainingLabel: '—',
    fareLabel: '',
    startOtp: LIVE_TRACKING_SCREEN.defaultOtp,
    driver: {
      name: driverName,
      vehicleLabel: car,
      plateNumber: plate,
      rating: LIVE_TRACKING_SCREEN.defaultRating,
    },
    pickupLabel: 'Pickup',
    pickupAddress: fullOrShort(params.origin) || 'Pickup',
    dropoffLabel: 'Drop-off',
    dropoffAddress: fullOrShort(params.destination) || 'Drop-off',
    pickup: {
      latitude: hasOriginCoords ? params.originLat! : DEFAULT_MAP_COORDINATE.latitude,
      longitude: hasOriginCoords ? params.originLng! : DEFAULT_MAP_COORDINATE.longitude,
    },
    dropoff: {
      latitude: hasDestinationCoords
        ? params.destinationLat!
        : DEFAULT_MAP_COORDINATE.latitude + 0.04,
      longitude: hasDestinationCoords
        ? params.destinationLng!
        : DEFAULT_MAP_COORDINATE.longitude - 0.06,
    },
  };
};

export const getLiveTrackingPath = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  plateNumber?: string;
  price?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  bookingId?: string;
}) => ({
  pathname: '/ride-search/live-tracking' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    plateNumber: params.plateNumber ?? '',
    price: params.price != null ? String(params.price) : '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
    bookingId: params.bookingId ?? '',
  },
});

const fullOrShort = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.trim();
};

const stripVehicleColor = (value?: string): string => {
  if (!value) {
    return '';
  }
  const withoutPlate = value.split('•')[0]?.trim() ?? value.trim();
  return withoutPlate.replace(/^White\s+/i, '').trim();
};

const extractPlate = (value?: string): string => {
  if (!value || !value.includes('•')) {
    return '';
  }
  return value.split('•')[1]?.trim() ?? '';
};
