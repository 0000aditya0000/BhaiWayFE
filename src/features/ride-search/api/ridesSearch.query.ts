import { ENDPOINTS } from '@/network/endpoints';

import type { SearchRidesQuery } from './ridesSearch.types';

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

  return `${ENDPOINTS.rides.search}?${params.toString()}`;
};
