import { httpClient } from '@/network';

import { buildSearchRidesPath } from './ridesSearch.query';
import type { SearchRidesQuery, SearchRidesResponseDto } from './ridesSearch.types';

export type {
  ApiSearchRideType,
  RideSearchDriverDto,
  RideSearchItemDto,
  RideSearchPreferencesDto,
  RideSearchVehicleDto,
  SearchRidesQuery,
  SearchRidesResponseDto,
} from './ridesSearch.types';

export { buildSearchRidesPath } from './ridesSearch.query';

/**
 * Searches published Regular rides for passengers.
 * Docs: GET /rides/search — Authorization: Bearer <BHAIWAY_JWT>
 */
export const searchRides = (query: SearchRidesQuery): Promise<SearchRidesResponseDto> =>
  httpClient.get<SearchRidesResponseDto>(buildSearchRidesPath(query));
