import { ENDPOINTS } from '@/network/endpoints';

import type { SearchRidesQuery } from './ridesSearch.types';

/**
 * Reject missing / NaN / 0 placeholders.
 * `Number('') === 0` from empty route params must never be sent to the API.
 */
export const isValidSearchCoordinate = (latitude?: number, longitude?: number): boolean => {
  if (latitude == null || longitude == null) {
    return false;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  // Treat any 0 as unresolved (empty route param → Number('') === 0).
  if (latitude === 0 || longitude === 0) {
    return false;
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  return true;
};

/** Parse a route/query coord string into a finite number, or undefined. */
export const parseSearchCoordinate = (raw: string | string[] | undefined): number | undefined => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'NaN' || trimmed === 'undefined' || trimmed === 'null') {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed === 0) {
    return undefined;
  }
  return parsed;
};

/** Stable decimal form for query strings (avoids long float noise / IsNumber maxDecimalPlaces). */
const formatCoordQueryValue = (value: number): string => {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded);
};

export const buildSearchRidesPath = (query: SearchRidesQuery): string => {
  const params = new URLSearchParams();
  params.set('source', query.source.trim());
  params.set('destination', query.destination.trim());
  params.set('date', query.date.trim());
  params.set('rideType', query.rideType ?? 'REGULAR');

  if (query.time?.trim()) {
    params.set('time', query.time.trim());
  }
  if (query.seats != null && Number.isFinite(query.seats)) {
    params.set('seats', String(Math.max(1, Math.floor(query.seats))));
  }
  if (query.page != null && Number.isFinite(query.page)) {
    params.set('page', String(Math.max(1, Math.floor(query.page))));
  }
  if (query.limit != null && Number.isFinite(query.limit)) {
    params.set('limit', String(Math.max(1, Math.floor(query.limit))));
  }

  const pickupOk = isValidSearchCoordinate(query.pickupLatitude, query.pickupLongitude);
  const dropoffOk = isValidSearchCoordinate(query.dropoffLatitude, query.dropoffLongitude);

  // Backend corridor matching expects a complete pickup+dropoff set — send all four or none.
  if (pickupOk && dropoffOk) {
    params.set('pickupLatitude', formatCoordQueryValue(query.pickupLatitude as number));
    params.set('pickupLongitude', formatCoordQueryValue(query.pickupLongitude as number));
    params.set('dropoffLatitude', formatCoordQueryValue(query.dropoffLatitude as number));
    params.set('dropoffLongitude', formatCoordQueryValue(query.dropoffLongitude as number));
  }

  return `${ENDPOINTS.rides.search}?${params.toString()}`;
};
