import { ENDPOINTS, httpClient } from '@/network';

import type { RideSearchItemDto } from './ridesSearch.types';

/**
 * Passenger-safe ride details.
 * Docs: GET /rides/public/:id — Authorization: Bearer <BHAIWAY_JWT>
 */
export const getPublicRideById = async (id: string): Promise<RideSearchItemDto> => {
  const response = await httpClient.get<RideSearchItemDto>(
    ENDPOINTS.rides.publicById(id),
  );

  // Temporary debug: full public ride payload for Assured Review / Details.
  console.log('[GET /rides/public/:id] rideId=', id);
  console.log('[GET /rides/public/:id] full response object:', response);
  console.log(
    '[GET /rides/public/:id] full response JSON:\n',
    JSON.stringify(response, null, 2),
  );
  if (response && typeof response === 'object') {
    console.log('[GET /rides/public/:id] keys:', Object.keys(response as object));
    for (const [key, value] of Object.entries(response as Record<string, unknown>)) {
      console.log(`[GET /rides/public/:id] ${key}=`, value);
    }
  }

  return response;
};
