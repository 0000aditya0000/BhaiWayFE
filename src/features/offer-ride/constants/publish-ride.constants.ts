import { ROUTES } from '@/config';

import type { LocationFieldType, OutstationRideTypeId, PublishRideDraft } from '../types';

export const DEFAULT_PUBLISH_DRAFT: PublishRideDraft = {
  rideType: 'regular',
  origin: '',
  destination: '',
  departureDate: '',
  departureTime: '',
  maxTwoInBackSeat: false,
  availableSeats: 1,
  womenOnly: false,
  pricePerSeat: '0.00',
  originLocation: null,
  destinationLocation: null,
  preferences: {
    noSmoking: false,
    noPets: false,
    luggage: false,
    music: false,
  },
  notes: '',
  selectedVehicleId: null,
  promoCode: '',
  promoApplied: false,
  routeSelection: null,
};

export const PUBLISH_RIDE_SCREEN = {
  title: 'Publish Carpool Ride',
  intro: {
    title: 'Publish Carpool Ride',
    subtitle: 'Fill in the details to share your journey.',
  },
} as const;

export const SELECT_LOCATION_SCREEN = {
  origin: {
    title: 'Starting point',
    mapLabel: 'Set starting point',
    confirmLabel: 'Confirm Starting Point',
    placeholder: 'Leaving from',
  },
  destination: {
    title: 'Destination',
    mapLabel: 'Set destination',
    confirmLabel: 'Confirm Destination',
    placeholder: 'Going to',
  },
  hint: 'Drag the map to refine the exact point',
  searchPlaceholder: 'Search for a place',
} as const;

export const PUBLISH_SEAT_LIMITS = {
  min: 1,
  max: 8,
} as const;

export const getPublishRidePath = (rideType: OutstationRideTypeId) => ({
  pathname: ROUTES.offerRidePublish,
  params: { rideType },
});

export const getSelectLocationPath = (field: LocationFieldType) => ({
  pathname: ROUTES.offerRideLocation,
  params: { field },
});

export const getRidePreferencesPath = () => ROUTES.offerRidePreferences;

/** Readable 12-hour time, e.g. 8:00 AM */
export const formatTimeLabel = (date: Date): string => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${period}`;
};

export const parseTimeLabel = (value: string): Date => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  const date = new Date();

  if (!match) {
    date.setHours(9, 0, 0, 0);
    return date;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'AM' && hours === 12) {
    hours = 0;
  } else if (period === 'PM' && hours !== 12) {
    hours += 12;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
};
