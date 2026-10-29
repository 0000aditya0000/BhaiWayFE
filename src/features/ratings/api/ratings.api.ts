import { env } from '@/config';
import { ENDPOINTS, httpClient } from '@/network';

import {
  unwrapUserRatingsPage,
  type UserRatingsPage,
} from '../utils/userRatings.normalize';

import type {
  PendingRatingTask,
  PendingRatingsResponse,
  GetUserRatingsOptions,
  SkipRatingResponse,
  SubmitRatingRequest,
  SubmitRatingResponse,
} from './ratings.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asString = (value: unknown): string => String(value ?? '').trim();

const normalizeRole = (value: unknown): PendingRatingTask['role'] => {
  const role = asString(value).toUpperCase();
  return role === 'DRIVER' ? 'DRIVER' : 'PASSENGER';
};

const normalizeRideContext = (
  value: unknown,
): PendingRatingTask['ride'] => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    rideId: asString(record.rideId ?? record.id),
    source: asString(record.source),
    destination: asString(record.destination),
    departureDate: asString(record.departureDate),
    departureTime: asString(record.departureTime),
  };
};

export const normalizePendingRatingTask = (value: unknown): PendingRatingTask | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const taskId = asString(record.taskId ?? record.id);
  if (!taskId) {
    return null;
  }
  return {
    taskId,
    rideId: asString(record.rideId),
    bookingId: asString(record.bookingId),
    userId: asString(record.userId),
    userName: asString(record.userName) || 'User',
    userPhoto: asString(record.userPhoto),
    role: normalizeRole(record.role),
    skippedAt:
      typeof record.skippedAt === 'string' && record.skippedAt.trim()
        ? record.skippedAt.trim()
        : null,
    ride: normalizeRideContext(record.ride),
  };
};

export const unwrapPendingRatings = (payload: unknown): PendingRatingTask[] => {
  const record = asRecord(payload);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(record?.items)
      ? record.items
      : [];
  return rawItems
    .map((item) => normalizePendingRatingTask(item))
    .filter((item): item is PendingRatingTask => item != null);
};

const buildSubmitBody = (request: SubmitRatingRequest): SubmitRatingRequest => {
  const comment = request.comment?.trim();
  return {
    taskId: request.taskId.trim(),
    rating: Math.floor(request.rating),
    ...(comment ? { comment } : {}),
  };
};

/** GET /ratings/pending — authoritative pending rating obligations. */
export const getPendingRatings = async (): Promise<PendingRatingTask[]> => {
  const payload = await httpClient.get<PendingRatingsResponse | unknown>(
    ENDPOINTS.ratings.pending,
  );
  return unwrapPendingRatings(payload);
};

/** POST /ratings — completes a rating task. */
export const submitRating = async (
  request: SubmitRatingRequest,
): Promise<SubmitRatingResponse> => {
  return httpClient.post<SubmitRatingResponse>(
    ENDPOINTS.ratings.submit,
    buildSubmitBody(request),
  );
};

/** POST /ratings/:taskId/skip — records skip; task remains PENDING on backend. */
export const skipRatingTask = async (taskId: string): Promise<SkipRatingResponse> => {
  const safeId = taskId.trim();
  return httpClient.post<SkipRatingResponse>(ENDPOINTS.ratings.skip(safeId), undefined);
};

/** GET /ratings/user/:userId — ratings for a user profile. */
export const getUserRatings = async (
  userId: string,
  options?: GetUserRatingsOptions,
): Promise<UserRatingsPage> => {
  const safeId = userId.trim();
  const direction = options?.direction;
  const path =
    direction === 'given'
      ? `${ENDPOINTS.ratings.user(safeId)}?direction=GIVEN`
      : direction === 'received'
        ? `${ENDPOINTS.ratings.user(safeId)}?direction=RECEIVED`
        : ENDPOINTS.ratings.user(safeId);
  const url = `${env.apiBaseUrl.replace(/\/+$/, '')}${path}`;

  // eslint-disable-next-line no-console
  console.log('[BhaiWay Ratings API] → GET user ratings', {
    method: 'GET',
    path,
    url,
    userId: safeId,
    direction: direction ?? 'received',
  });

  try {
    const payload = await httpClient.get<unknown>(path);
    const page = unwrapUserRatingsPage(payload);

    // eslint-disable-next-line no-console
    console.log('[BhaiWay Ratings API] ← GET user ratings response', {
      path,
      userId: safeId,
      rawPayload: payload,
      parsedCount: page.items.length,
      averageRating: page.averageRating,
      total: page.total,
      totalRatings: page.totalRatings,
      direction: page.direction,
      parsedItems: page.items,
    });

    if (page.items.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[BhaiWay Ratings API] parsed 0 items — check rawPayload shape above', {
        path,
        userId: safeId,
        payloadKeys:
          payload && typeof payload === 'object' && !Array.isArray(payload)
            ? Object.keys(payload as Record<string, unknown>)
            : Array.isArray(payload)
              ? ['<top-level-array>']
              : [],
      });
    }

    return page;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[BhaiWay Ratings API] ✕ GET user ratings failed', {
      path,
      url,
      userId: safeId,
      error,
    });
    throw error;
  }
};
