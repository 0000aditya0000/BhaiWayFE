import { ENDPOINTS, httpClient } from '@/network';

import { unwrapBookingHistoryItem } from './bookingsHistory.unwrap';
import type {
  BookingHistoryItemDto,
  BookingHistoryPageDto,
  BookingHistoryPageResult,
  ListBookingHistoryQuery,
} from './bookingsHistory.types';

export type {
  BookingHistoryItemDto,
  BookingHistoryPageDto,
  BookingHistoryPageResult,
  BookingHistoryStatusFilter,
  ListBookingHistoryQuery,
} from './bookingsHistory.types';

export { unwrapBookingHistoryItem } from './bookingsHistory.unwrap';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asItemArray = (value: unknown): BookingHistoryItemDto[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value as BookingHistoryItemDto[];
};

/**
 * Accept common paginated / wrapped shapes from Nest/Express backends.
 * e.g. [], { items }, { bookings }, { results }, { data: [] }, { data: { items } }
 */
export const unwrapBookingHistoryItems = (payload: unknown): BookingHistoryItemDto[] => {
  const direct = asItemArray(payload);
  if (direct) {
    return direct;
  }

  const root = asRecord(payload);
  if (!root) {
    return [];
  }

  for (const key of ['items', 'bookings', 'results', 'rows', 'history'] as const) {
    const list = asItemArray(root[key]);
    if (list) {
      return list;
    }
  }

  const nested = asRecord(root.data);
  if (nested) {
    for (const key of ['items', 'bookings', 'results', 'rows', 'history'] as const) {
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
  query: ListBookingHistoryQuery,
  items: BookingHistoryItemDto[],
): BookingHistoryPageResult => {
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

const buildBookingHistoryPath = (query: ListBookingHistoryQuery = {}): string => {
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
  return qs ? `${ENDPOINTS.bookings.history}?${qs}` : ENDPOINTS.bookings.history;
};

/**
 * Passenger past bookings — COMPLETED and CANCELLED only.
 * Docs: GET /bookings/history?status=&page=&limit=
 */
export const listBookingHistory = async (
  query: ListBookingHistoryQuery = {},
): Promise<BookingHistoryPageResult> => {
  const payload = await httpClient.get<unknown>(buildBookingHistoryPath(query));
  const items = unwrapBookingHistoryItems(payload);
  if (__DEV__ && items.length === 0) {
    console.log('[Booking History] empty unwrap', {
      path: buildBookingHistoryPath(query),
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
 * Passenger past booking detail (owner only).
 * Docs: GET /bookings/history/:id
 */
export const getBookingHistoryById = async (id: string): Promise<BookingHistoryItemDto> => {
  const payload = await httpClient.get<unknown>(ENDPOINTS.bookings.historyById(id));
  return unwrapBookingHistoryItem(payload);
};

/** Pure path helper for tests. */
export const formatListBookingHistoryPath = (query: ListBookingHistoryQuery = {}): string =>
  buildBookingHistoryPath(query);

/** Pure path helper for tests. */
export const formatBookingHistoryByIdPath = (id: string): string =>
  ENDPOINTS.bookings.historyById(id);
