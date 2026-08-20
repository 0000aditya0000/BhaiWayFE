import { ENDPOINTS, httpClient } from '@/network';

import type { CreateRideDto, RideResponseDto } from './rides.types';

export type {
  ApiRideStatus,
  ApiRideType,
  CreateRideDto,
  RideResponseDto,
} from './rides.types';

export { CREATE_RIDE_SEAT_LIMITS, WOMEN_ONLY_BACKEND_FIELD } from './rides.types';

const unwrapRideList = (payload: unknown): RideResponseDto[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items as RideResponseDto[];
    }
    if (Array.isArray(record.rides)) {
      return record.rides as RideResponseDto[];
    }
    if (Array.isArray(record.data)) {
      return record.data as RideResponseDto[];
    }
  }
  return [];
};

/**
 * Publishes a Regular Ride for the authenticated driver.
 * Docs: POST /rides — 201 RideResponseDto
 */
export const createRide = (payload: CreateRideDto): Promise<RideResponseDto> =>
  httpClient.post<RideResponseDto>(ENDPOINTS.rides.create, payload);

/**
 * Lists rides owned by the authenticated driver.
 * Docs: GET /rides/my
 */
export const listMyRides = async (): Promise<RideResponseDto[]> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.rides.my);
  return unwrapRideList(payload);
};
