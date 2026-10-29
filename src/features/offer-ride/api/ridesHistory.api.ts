import { ENDPOINTS, httpClient } from '@/network';

import {
  flattenRideHistoryListItems,
  unwrapRideHistoryItem,
} from './ridesHistory.unwrap';
import type {
  ListRideHistoryQuery,
  RideHistoryItemDto,
  RideHistoryPageDto,
  RideHistoryPageResult,
} from './ridesHistory.types';

export type {
  ListRideHistoryQuery,
  RideHistoryItemDto,
  RideHistoryPageDto,
  RideHistoryPageResult,
  RideHistoryPassengerEarningDto,
  RideHistoryStatusFilter,
  RideHistoryVehicleDto,
} from './ridesHistory.types';

export {
  flattenRideHistoryListItem,
  flattenRideHistoryListItems,
  unwrapRideHistoryItem,
} from './ridesHistory.unwrap';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asItemArray = (value: unknown): RideHistoryItemDto[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value as RideHistoryItemDto[];
};

/**
 * Accept common paginated / wrapped shapes from Nest/Express backends.
 * e.g. [], { items }, { rides }, { results }, { data: [] }, { data: { items } }
 */
export const unwrapRideHistoryItems = (payload: unknown): RideHistoryItemDto[] => {
  const direct = asItemArray(payload);
  if (direct) {
    return direct;
  }

  const root = asRecord(payload);
  if (!root) {
    return [];
  }

  for (const key of ['items', 'rides', 'results', 'rows', 'history'] as const) {
    const list = asItemArray(root[key]);
    if (list) {
      return list;
    }
  }

  const nested = asRecord(root.data);
  if (nested) {
    for (const key of ['items', 'rides', 'results', 'rows', 'history'] as const) {
      const list = asItemArray(nested[key]);
      if (list) {
        return list;
      }
    }
  }

  const dataList = asItemArray(root.data);
  if (dataList) {
    return dataList;
  }

  return [];
};

const normalizeHistoryPage = (
  payload: unknown,
  query: ListRideHistoryQuery,
  items: RideHistoryItemDto[],
): RideHistoryPageResult => {
  const limit = Math.max(1, Math.floor(query.limit ?? 20));
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const meta = nested ?? root;

  if (meta) {
    const resolvedPage =
      typeof meta.page === 'number' && Number.isFinite(meta.page)
        ? Math.max(1, Math.floor(meta.page))
        : page;
    const resolvedLimit =
      typeof meta.limit === 'number' && Number.isFinite(meta.limit)
        ? Math.max(1, Math.floor(meta.limit))
        : limit;
    const total =
      typeof meta.total === 'number' && Number.isFinite(meta.total)
        ? meta.total
        : null;
    const totalPages =
      typeof meta.totalPages === 'number' && Number.isFinite(meta.totalPages)
        ? meta.totalPages
        : total != null
          ? Math.ceil(total / resolvedLimit)
          : null;
    const hasMore =
      typeof meta.hasMore === 'boolean'
        ? meta.hasMore
        : totalPages != null
          ? resolvedPage < totalPages
          : items.length >= resolvedLimit;

    return {
      items,
      page: resolvedPage,
      limit: resolvedLimit,
      total,
      totalPages,
      hasMore,
    };
  }

  return {
    items,
    page,
    limit,
    total: null,
    totalPages: null,
    hasMore: items.length >= limit,
  };
};

const buildRideHistoryPath = (query: ListRideHistoryQuery = {}): string => {
  const params = new URLSearchParams();
  if (query.status?.trim()) {
    params.set('status', query.status.trim().toUpperCase());
  }
  if (query.page != null && Number.isFinite(query.page)) {
    params.set('page', String(Math.max(1, Math.floor(query.page))));
  }
  if (query.limit != null && Number.isFinite(query.limit)) {
    params.set('limit', String(Math.max(1, Math.floor(query.limit))));
  }
  const qs = params.toString();
  return qs ? `${ENDPOINTS.rides.history}?${qs}` : ENDPOINTS.rides.history;
};

/**
 * Driver past rides — COMPLETED and CANCELLED only.
 * Docs: GET /rides/history?status=&page=&limit=
 */
export const listRideHistory = async (
  query: ListRideHistoryQuery = {},
): Promise<RideHistoryPageResult> => {
  const payload = await httpClient.get<unknown>(buildRideHistoryPath(query));
  const items = flattenRideHistoryListItems(unwrapRideHistoryItems(payload));
  if (__DEV__ && items.length === 0) {
    console.log('[Ride History] empty unwrap', {
      path: buildRideHistoryPath(query),
      payloadType: Array.isArray(payload) ? 'array' : typeof payload,
      keys:
        payload && typeof payload === 'object' && !Array.isArray(payload)
          ? Object.keys(payload as object)
          : null,
    });
  }
  return normalizeHistoryPage(payload, query, items);
};

/**
 * Driver past ride detail (owner only).
 * Docs: GET /rides/history/:id
 */
export const getRideHistoryById = async (id: string): Promise<RideHistoryItemDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.rides.historyById(id));
  return unwrapRideHistoryItem(payload);
};

/** Pure path helper for tests. */
export const formatListRideHistoryPath = (query: ListRideHistoryQuery = {}): string =>
  buildRideHistoryPath(query);

/** Pure path helper for tests. */
export const formatRideHistoryByIdPath = (id: string): string =>
  ENDPOINTS.rides.historyById(id);
