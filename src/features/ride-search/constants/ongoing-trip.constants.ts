import type { OngoingTripData, RideType } from '../types';
import { DEFAULT_MAP_COORDINATE } from './ride-search.constants';
import { formatBhaiWayCoins } from '@/shared/utils';

export const ONGOING_TRIP_SCREEN = {
  destinationBadge: 'DESTINATION',
  estimatedFareLabel: 'Estimated Fare',
  safetyLabel: 'Safety & Support',
  sosConfirmTitle: 'Emergency SOS',
  sosConfirmMessage:
    'SOS Alert triggered! Emergency services and your contacts are being notified.',
  safetyTitle: 'Safety & Support',
  safetyMessage: 'Safety tools and support options will be available soon.',
  defaultDropoffEta: 'Drop-off at 09:15 AM',
  defaultRemaining: '12 mins remaining • 5.4 km',
  defaultDriverName: 'Vikram',
  defaultVehicle: 'Swift Dzire',
  defaultPlate: 'DL 01 AB 1234',
  defaultRating: 4.9,
  defaultRidesCount: '1.2k Rides',
  defaultFare: 240,
  driverAvatarUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB639eZeH_QK4qcGjS4NEyGlt4RUqVlms8_40Jz4XVbM1ppBe8-EjCH0GwDgYyb4kIGrmvvcxkP1ywxRNvkbd2xH18PKHz0Pyf-8FYrWHgvtAuBJdhU0FUf5feroOG6tle2HB6TgLxa-gLHQAEVW90m6vd9B6O1BHZYSrlr_YShMP9FBDwyhHdORJED-Pp8ZRMNMbVCr5pHLeVtikaQ39yhT_DyWfZAcCinBsbrV6Jgs5F2J626ej9srwDKnF3iN3l1Z_2IXKMZPsA',
} as const;

export const getOngoingTripMock = (params: {
  rideId: string;
  rideType: RideType;
  driverName?: string;
  carModel?: string;
  price?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}): OngoingTripData => {
  const driverFirst = (params.driverName || ONGOING_TRIP_SCREEN.defaultDriverName).split(' ')[0];
  const car = stripVehicleColor(params.carModel) || ONGOING_TRIP_SCREEN.defaultVehicle;
  const plate = extractPlate(params.carModel) || ONGOING_TRIP_SCREEN.defaultPlate;
  const fare =
    params.price != null && Number.isFinite(params.price)
      ? params.price
      : ONGOING_TRIP_SCREEN.defaultFare;

  return {
    rideId: params.rideId,
    rideType: params.rideType,
    dropoffEtaLabel: ONGOING_TRIP_SCREEN.defaultDropoffEta,
    remainingLabel: ONGOING_TRIP_SCREEN.defaultRemaining,
    estimatedFareLabel: formatBhaiWayCoins(fare, { spaced: false, minimumFractionDigits: 2 }),
    driver: {
      name: driverFirst,
      rating: ONGOING_TRIP_SCREEN.defaultRating,
      ridesCountLabel: ONGOING_TRIP_SCREEN.defaultRidesCount,
      vehicleLabel: `White ${car}`,
      plateNumber: plate,
      avatarUri: ONGOING_TRIP_SCREEN.driverAvatarUri,
    },
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

export const getOngoingTripPath = (params: {
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
  pathname: '/ride-search/ongoing-trip' as const,
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
    bookingId: params.bookingId ?? '',
  },
});

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
