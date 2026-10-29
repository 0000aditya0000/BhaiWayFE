import { ENDPOINTS, httpClient } from '@/network';

import {
  unwrapRouteOptionsResponse,
} from '../utils/routeSelection';
import { toApiCoordinate } from '../utils/createRide.mapper';
import type {
  RequestRouteOptionsDto,
  RouteOptionDto,
} from './routeOptions.types';

const toRequestCoordinate = (value: number): number => {
  const normalized = toApiCoordinate(value);
  if (normalized == null) {
    throw new Error('Invalid route-options coordinate');
  }
  return normalized;
};

export const buildRouteOptionsRequest = (
  input: RequestRouteOptionsDto,
): RequestRouteOptionsDto => {
  const body: RequestRouteOptionsDto = {
    sourceLatitude: toRequestCoordinate(input.sourceLatitude),
    sourceLongitude: toRequestCoordinate(input.sourceLongitude),
    destinationLatitude: toRequestCoordinate(input.destinationLatitude),
    destinationLongitude: toRequestCoordinate(input.destinationLongitude),
  };
  const source = input.source?.trim();
  const destination = input.destination?.trim();
  if (source) {
    body.source = source;
  }
  if (destination) {
    body.destination = destination;
  }
  return body;
};

/**
 * Docs: POST /rides/route-options — 200 RouteOptionsResponseDto
 * Response is `{ options }` at HTTP root (no data wrapper).
 */
export const fetchRouteOptions = async (
  input: RequestRouteOptionsDto,
): Promise<RouteOptionDto[]> => {
  const body = buildRouteOptionsRequest(input);
  const payload = await httpClient.post<unknown>(ENDPOINTS.rides.routeOptions, body);
  return unwrapRouteOptionsResponse(payload);
};

export const formatRouteOptionsPath = (): string => ENDPOINTS.rides.routeOptions;
