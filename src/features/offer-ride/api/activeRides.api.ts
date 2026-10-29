import { ENDPOINTS, httpClient } from '@/network';

import { unwrapActiveRideItems } from './activeRides.unwrap';
import type { ActiveRidesResponseDto } from './rides.types';

export { unwrapActiveRideItems } from './activeRides.unwrap';

/** Docs: GET /rides/my-active — in-progress rides for the home live-ride container. */
export const listMyActiveRides = async (): Promise<ActiveRidesResponseDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.rides.myActive);
  return { items: unwrapActiveRideItems(payload) };
};

export const formatListMyActiveRidesPath = (): string => ENDPOINTS.rides.myActive;
