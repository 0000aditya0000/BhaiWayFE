import type {
  RideSearchDriverDto,
  RideSearchItemDto,
} from '@/features/ride-search/api/ridesSearch.types';
import type { BookingCoPassengerSnapshotDto } from '@/features/ride-search/api/bookings.types';
import {
  mapDriverRatingFromSearch,
  mapVehicleLabelFromSearch,
} from '@/features/ride-search/utils/mapDriverPassengerCard';
import { formatApiDepartureTime } from '@/features/ride-search/utils/rideSearch.mapper';

import type { CommuteRideResultItem } from '../types/commute-ride-result.types';
import { COMMUTE_RIDE_RESULT_SCREEN } from '../constants/commute-ride-result.constants';
import {
  isCommuteApiRideType,
  resolveCommuteRiderPricePerSeat,
  resolveRouteMatchPercentFromApi,
} from './commuteBooking.utils';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const formatCivilDateLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const resolveCoPassengers = (
  item: RideSearchItemDto,
): readonly BookingCoPassengerSnapshotDto[] =>
  item.coPassengers ?? item.passengers ?? item.bookedPassengers ?? [];

const resolveDriverVerified = (driver: RideSearchDriverDto): boolean =>
  driver.isCorporateVerified === true ||
  driver.corporateVerified === true ||
  driver.verified === true;

const resolveOrganization = (item: RideSearchItemDto): string => {
  const driver = item.driver;
  return (
    item.organization?.trim() ||
    item.company?.trim() ||
    driver.organization?.trim() ||
    driver.company?.trim() ||
    ''
  );
};

const asApiRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
};

export interface CommuteSearchMapContext {
  routeMatchByRideId?: Record<string, number | string | null | undefined>;
  matchPercentByRideId?: Record<string, number | string | null | undefined>;
}

const resolveMatchPercent = (
  item: RideSearchItemDto,
  searchContext?: CommuteSearchMapContext,
): number | null => {
  const typedPercentage =
    item.routeMatchPercentage ??
    item.route_match_percentage ??
    item.routeMatchPercent ??
    item.matchPercent ??
    item.matchScore;
  if (typedPercentage != null && typedPercentage !== '') {
    const fromTyped = resolveRouteMatchPercentFromApi({
      routeMatchPercentage: typedPercentage,
    });
    if (fromTyped != null) {
      return fromTyped;
    }
  }

  const fromApi = resolveRouteMatchPercentFromApi(item);
  if (fromApi != null) {
    return fromApi;
  }

  const contextRecord = asApiRecord(searchContext);
  if (contextRecord && item.id) {
    const byRideId =
      asApiRecord(contextRecord.routeMatchByRideId) ??
      asApiRecord(contextRecord.matchPercentByRideId) ??
      asApiRecord(contextRecord.route_match_by_ride_id);
    if (byRideId) {
      const mapped = resolveRouteMatchPercentFromApi(byRideId[item.id]);
      if (mapped != null) {
        return mapped;
      }
    }
  }

  return null;
};

const buildSeatsNote = (coPassengerCount: number): string =>
  coPassengerCount > 0
    ? COMMUTE_RIDE_RESULT_SCREEN.sharedByOthers(coPassengerCount)
    : COMMUTE_RIDE_RESULT_SCREEN.directRide;

/** Maps GET /rides/search COMMUTE item → office commute result card. */
export const mapRideSearchItemToCommuteResult = (
  item: RideSearchItemDto,
  searchContext?: CommuteSearchMapContext,
): CommuteRideResultItem => {
  const riderPrice = resolveCommuteRiderPricePerSeat(item);
  const seatsLeft = Math.max(0, item.availableSeats);
  const coPassengerCount = resolveCoPassengers(item).length;
  const driverRating = mapDriverRatingFromSearch(item.driver);
  const verified = resolveDriverVerified(item.driver);
  const vehicleLabel = mapVehicleLabelFromSearch(item.vehicle);
  const vehicleColor = item.vehicle?.color?.trim() || '';

  return {
    id: item.id,
    rideType: 'commute',
    driver: {
      id: item.driver.id,
      name: item.driver.displayName?.trim() || 'BhaiWay Driver',
      rating: driverRating.averageRating,
      totalRatings: driverRating.totalRatings,
      verified,
      avatarUri: item.driver.profilePhoto?.trim() || undefined,
      recentRides: [],
    },
    vehicle: {
      id: item.vehicle?.id?.trim() || '',
      label: vehicleLabel,
      color: vehicleColor,
      vehicleType: item.vehicle?.vehicleType?.trim() || '',
      seatingCapacity: Math.max(0, Math.floor(Number(item.vehicle?.seatingCapacity) || 0)),
      make: item.vehicle?.make?.trim() || '',
      model: item.vehicle?.model?.trim() || '',
      variant: item.vehicle?.variant?.trim() || '',
    },
    price: riderPrice,
    departureTime: formatApiDepartureTime(item.departureTime),
    carModel: vehicleLabel,
    seatsLeft,
    ac: true,
    luggage: item.preferences?.luggageAllowed ? 'Medium' : 'Small',
    originCity: shortPlaceName(item.source),
    destinationCity: shortPlaceName(item.destination),
    distanceKm: 0,
    durationMinutes: 0,
    durationLabel: formatCivilDateLabel(item.departureDate),
    preferences: [],
    features: [],
    vehicleColor: vehicleColor || 'White',
    seatsNote: buildSeatsNote(coPassengerCount),
    organization: resolveOrganization(item),
    riderPricePerSeat: riderPrice,
    availableSeats: seatsLeft,
    departureDate: item.departureDate,
    source: item.source,
    destination: item.destination,
    pickupLabel: item.source?.trim() || 'Pickup',
    dropoffLabel: item.destination?.trim() || 'Drop-off',
    driverRating: driverRating.averageRating,
    matchPercent: resolveMatchPercent(item, searchContext),
    coPassengerCount,
  };
};

export const mapCommuteSearchItemsToResults = (
  items: readonly RideSearchItemDto[],
  searchContext?: CommuteSearchMapContext,
): CommuteRideResultItem[] =>
  items
    .filter((item) => isCommuteApiRideType(item.rideType))
    .map((item) => mapRideSearchItemToCommuteResult(item, searchContext));
