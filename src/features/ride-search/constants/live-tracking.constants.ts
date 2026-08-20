import type { LiveTrackingData, RideType } from '../types';
import { DEFAULT_MAP_COORDINATE } from './ride-search.constants';

export const LIVE_TRACKING_SCREEN = {
  title: 'Live Tracking',
  etaLabel: 'Estimated Arrival',
  etaAwayLabel: (mins: number) => `${mins} mins away`,
  chatLabel: 'Chat',
  callLabel: 'Call',
  otpHint: 'Share this OTP to start trip',
  whyOtpLabel: 'Why do I need this?',
  whyOtpTitle: 'Start OTP',
  whyOtpMessage:
    'Share this one-time code with your driver when they arrive. It confirms your identity and starts the trip securely.',
  waitingTitle: 'Waiting for driver',
  waitingMessage:
    'Live map tracking will appear once your driver starts the ride with your OTP.',
  waitingBadge: 'Not started yet',
  shareTripLabel: 'Share Trip',
  shareTripHint: 'Live location',
  supportLabel: 'Support',
  supportHint: 'Help center',
  supportTitle: 'Support',
  supportMessage: 'Help center will be available soon.',
  shareTripMessage: (driverName: string, etaMins: number, otp: string) =>
    `I'm on a BhaiWay ride with ${driverName}. ETA ${etaMins} mins. Start OTP: ${otp}`,
  defaultEtaMinutes: 4,
  defaultOtp: '4821',
  defaultDriverName: 'Vikram',
  defaultVehicle: 'Swift Dzire',
  defaultPlate: 'HR 26 DQ 8842',
  defaultRating: 4.9,
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
  const driverFirst = (params.driverName || LIVE_TRACKING_SCREEN.defaultDriverName).split(' ')[0];
  const car = stripVehicleColor(params.carModel) || LIVE_TRACKING_SCREEN.defaultVehicle;
  const plate = extractPlate(params.carModel) || LIVE_TRACKING_SCREEN.defaultPlate;

  return {
    rideId: params.rideId,
    rideType: params.rideType,
    statusLabel: LIVE_TRACKING_SCREEN.etaLabel,
    etaMinutes: LIVE_TRACKING_SCREEN.defaultEtaMinutes,
    startOtp: LIVE_TRACKING_SCREEN.defaultOtp,
    driver: {
      name: driverFirst,
      vehicleLabel: `White ${car}`,
      plateNumber: plate,
      rating: LIVE_TRACKING_SCREEN.defaultRating,
    },
    pickupLabel: 'Pickup',
    pickupAddress: fullOrShort(params.origin) || 'Hauz Khas Village, Delhi',
    dropoffLabel: 'Drop-off',
    dropoffAddress: fullOrShort(params.destination) || 'Cyber City, Gurugram',
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

export const getLiveTrackingPath = (params: {
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
}) => ({
  pathname: '/ride-search/live-tracking' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
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
