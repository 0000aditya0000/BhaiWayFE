import {
  publishedRidesSheetStore,
  type PublishedRidesSheetRow,
} from '@/DemoData';
import { authSession } from '@/store';
import {
  getPublishedRideOrganization,
  getPublishedRideVehicleColor,
  mapPublishedRideToResult,
} from '@/features/ride-search/utils';

import type { CommuteRideResultItem } from '../types/commute-ride-result.types';

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const mapPublishedRideToCommuteResult = (row: PublishedRidesSheetRow): CommuteRideResultItem => {
  const base = mapPublishedRideToResult(row);
  const seatsLeft = Math.max(0, row.availableSeats);
  const source = row.origin?.trim() || 'Pickup';
  const destination = row.destination?.trim() || 'Drop-off';
  return {
    ...base,
    rideType: 'commute',
    vehicleColor: getPublishedRideVehicleColor(row),
    seatsNote: seatsLeft === 1 ? '1 seat left' : `${seatsLeft} seats left`,
    organization: getPublishedRideOrganization(row),
    riderPricePerSeat: base.price,
    availableSeats: seatsLeft,
    departureDate: row.departureDate ?? '',
    source,
    destination,
    pickupLabel: source,
    dropoffLabel: destination,
    driverRating: base.driver.rating > 0 ? base.driver.rating : null,
    matchPercent: null,
    coPassengerCount: 0,
  };
};

/** Published rides for office commute search (DemoData only; excludes own offers). */
export const getPublishedRidesForCommuteSearch = (): CommuteRideResultItem[] => {
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
    .map(mapPublishedRideToCommuteResult);
};
