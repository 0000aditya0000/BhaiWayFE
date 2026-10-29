import {
  publishedRidesSheetStore,
  userDetailsSheetStore,
  type PublishedRidesSheetRow,
} from '@/DemoData';
import { authSession } from '@/store';

import type { RidePreference, RideResultItem } from '../types';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const parsePrice = (raw: string): number => {
  const amount = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const mapPreferences = (raw: string): RidePreference[] =>
  raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `pref-${index}`,
      label,
      icon: 'checkmark-circle-outline',
    }));

/** Map a PublishedRides sheet row into a search result card. */
export const mapPublishedRideToResult = (row: PublishedRidesSheetRow): RideResultItem => {
  const owner = userDetailsSheetStore.findByMobile(row.mobile);
  const vehicleLabel = row.vehicleName?.trim() || 'Car';
  return {
    id: `pub-${row.rideId}`,
    rideType: row.rideType,
    driver: {
      id: `driver-${row.userId || normalizeMobile(row.mobile) || row.rideId}`,
      name: owner?.userName?.trim() || 'BhaiWay Driver',
      rating: 0,
      totalRatings: 0,
      verified: true,
      avatarUri: owner?.profilePicture?.trim() || undefined,
      recentRides: [],
    },
    vehicle: {
      id: '',
      label: vehicleLabel,
      color: owner?.vehicleColor?.trim() || '',
      vehicleType: '',
      seatingCapacity: 0,
      make: '',
      model: vehicleLabel,
      variant: '',
    },
    price: parsePrice(row.pricePerSeat),
    departureTime: row.departureTime || '—',
    carModel: vehicleLabel,
    seatsLeft: Math.max(0, row.availableSeats),
    ac: true,
    luggage: row.preferences.toLowerCase().includes('luggage') ? 'Medium' : 'Small',
    originCity: shortPlaceName(row.origin),
    destinationCity: shortPlaceName(row.destination),
    distanceKm: 0,
    durationMinutes: 0,
    durationLabel: row.departureDate || 'Published',
    preferences: mapPreferences(row.preferences),
    features: row.womenOnly
      ? [{ id: 'women-only', label: 'Women only', icon: 'woman-outline' }]
      : [],
  };
};

/** Published rides available for riders to book (excludes current user's own offers). */
export const getPublishedRidesForSearch = (): RideResultItem[] => {
  const sessionPhone = normalizeMobile(authSession.getUser()?.phone);
  return publishedRidesSheetStore
    .getAll()
    .filter((row) => row.status === 'published')
    .filter((row) => {
      if (!sessionPhone) {
        return true;
      }
      return normalizeMobile(row.mobile) !== sessionPhone;
    })
    .map(mapPublishedRideToResult);
};

/** Organization label for a published ride owner (CorporateID / company text). */
export const getPublishedRideOrganization = (row: PublishedRidesSheetRow): string => {
  const owner = userDetailsSheetStore.findByMobile(row.mobile);
  return owner?.corporateId?.trim() || '—';
};

/** Vehicle color from UserDetails (or Vehicles-deprecated field) for commute cards. */
export const getPublishedRideVehicleColor = (row: PublishedRidesSheetRow): string => {
  const owner = userDetailsSheetStore.findByMobile(row.mobile);
  return owner?.vehicleColor?.trim() || '—';
};
