import { ROUTES } from '@/config';

import type { CommuteLocationField, CommuteSelectedLocation, PublishCommuteDraft } from '../types';

export const DEFAULT_START_LOCATION: CommuteSelectedLocation = {
  placeName: 'Hauz Khas Village',
  address: 'Hauz Khas Village, Delhi',
  latitude: 28.5494,
  longitude: 77.2001,
};

export const DEFAULT_OFFICE_LOCATION: CommuteSelectedLocation = {
  placeName: 'Connaught Place',
  address: 'Block G, Inner Circle, New Delhi, 110001',
  latitude: 28.6315,
  longitude: 77.2167,
};

export const DEFAULT_PUBLISH_COMMUTE_DRAFT: PublishCommuteDraft = {
  startLocation: '',
  officeLocation: '',
  startLocationDetail: null,
  officeLocationDetail: null,
  departureDate: '',
  departureTime: '09:00',
  seats: 3,
  recurringDays: [],
  returningBack: false,
  returnDepartureTime: '',
  pricePerSeat: '',
  routeSelection: null,
  returnRouteSelection: null,
};

export const SELECT_COMMUTE_LOCATION_SCREEN = {
  title: 'Select location',
  startPlaceholder: 'Leaving from',
  officePlaceholder: 'Drop-off at',
  hint: 'Drag the map to refine the exact point',
  searchPlaceholder: 'Search for a place',
  start: {
    mapLabel: 'Set pickup point',
    confirmLabel: 'Confirm Location',
  },
  office: {
    mapLabel: 'Set drop-off point',
    confirmLabel: 'Confirm Location',
  },
} as const;

export const getSelectCommuteLocationPath = (field: CommuteLocationField) => ({
  pathname: ROUTES.officeCommuteLocation,
  params: { field },
});
