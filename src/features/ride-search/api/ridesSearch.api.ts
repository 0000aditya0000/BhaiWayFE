import { httpClient } from '@/network';

import { buildSearchRidesPath } from './ridesSearch.query';
import type { SearchRidesQuery, SearchRidesResponseDto } from './ridesSearch.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
};

const unwrapSearchRidesResponse = (payload: unknown): SearchRidesResponseDto => {
  if (Array.isArray(payload)) {
    return {
      items: payload as SearchRidesResponseDto['items'],
      page: 1,
      limit: payload.length,
      total: payload.length,
      totalPages: 1,
    };
  }

  const record = asRecord(payload);
  if (!record) {
    return { items: [], page: 1, limit: 0, total: 0, totalPages: 0 };
  }

  const nested = asRecord(record.data);
  const items = Array.isArray(record.items)
    ? (record.items as SearchRidesResponseDto['items'])
    : Array.isArray(record.rides)
      ? (record.rides as SearchRidesResponseDto['items'])
      : Array.isArray(nested?.items)
        ? (nested.items as SearchRidesResponseDto['items'])
        : Array.isArray(record.data)
          ? (record.data as SearchRidesResponseDto['items'])
          : [];

  return {
    items,
    page: Number(record.page ?? nested?.page ?? 1) || 1,
    limit: Number(record.limit ?? nested?.limit ?? items.length) || items.length,
    total: Number(record.total ?? nested?.total ?? items.length) || items.length,
    totalPages: Number(record.totalPages ?? nested?.totalPages ?? 1) || 1,
    ...(record.routeMatchByRideId ? { routeMatchByRideId: record.routeMatchByRideId as SearchRidesResponseDto['routeMatchByRideId'] } : {}),
    ...(record.matchPercentByRideId ? { matchPercentByRideId: record.matchPercentByRideId as SearchRidesResponseDto['matchPercentByRideId'] } : {}),
    ...(record.route_match_by_ride_id ? { routeMatchByRideId: record.route_match_by_ride_id as SearchRidesResponseDto['routeMatchByRideId'] } : {}),
  };
};

export type {
  ApiSearchRideType,
  RideSearchDriverDto,
  RideSearchItemDto,
  RideSearchPreferencesDto,
  RideSearchVehicleDto,
  SearchRidesQuery,
  SearchRidesResponseDto,
} from './ridesSearch.types';

export { buildSearchRidesPath, isValidSearchCoordinate, parseSearchCoordinate } from './ridesSearch.query';

/**
 * Searches published Regular rides for passengers.
 * Docs: GET /rides/search — Authorization: Bearer <BHAIWAY_JWT>
 */
export const searchRides = async (query: SearchRidesQuery): Promise<SearchRidesResponseDto> => {
  const payload = await httpClient.get<unknown>(buildSearchRidesPath(query));
  return unwrapSearchRidesResponse(payload);
};
