import type { UserRatingItem, UserRatingsPage } from '../api/ratings.types';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const readNestedString = (record: Record<string, unknown>, key: string): string => {
  const direct = asString(record[key]);
  if (direct) {
    return direct;
  }
  const nested = asRecord(record[key]);
  if (!nested) {
    return '';
  }
  return (
    asString(nested.userName) ||
    asString(nested.name) ||
    asString(nested.displayName) ||
    asString(nested.fullName) ||
    [asString(nested.firstName), asString(nested.lastName)].filter(Boolean).join(' ')
  );
};

const readNestedPhoto = (record: Record<string, unknown>, key: string): string => {
  const direct = asString(record[key]);
  if (direct) {
    return direct;
  }
  const nested = asRecord(record[key]);
  if (!nested) {
    return '';
  }
  return (
    asString(nested.profilePhoto) ||
    asString(nested.photo) ||
    asString(nested.avatar) ||
    asString(nested.userPhoto)
  );
};

const resolveRatingValue = (record: Record<string, unknown>): number | null => {
  const ratingNode = record.rating;
  const candidates: unknown[] = [
    ratingNode,
    record.stars,
    record.score,
    record.value,
    record.star,
    record.ratingValue,
    record.ratingScore,
  ];

  if (ratingNode && typeof ratingNode === 'object') {
    const nested = asRecord(ratingNode);
    if (nested) {
      candidates.push(
        nested.rating,
        nested.stars,
        nested.score,
        nested.value,
      );
    }
  }

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      return Math.round(parsed);
    }
  }

  return null;
};

const resolveRole = (record: Record<string, unknown>): UserRatingItem['role'] => {
  const roleRaw = asString(
    record.ratedRole ??
      record.subjectRole ??
      record.targetRole ??
      record.userRole ??
      record.role,
  ).toUpperCase();

  if (roleRaw === 'DRIVER' || roleRaw === 'PASSENGER') {
    return roleRaw;
  }
  return undefined;
};

const normalizeRideContext = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    rideId: asString(record.rideId ?? record.id),
    source: asString(record.source ?? record.pickup ?? record.from),
    destination: asString(record.destination ?? record.dropoff ?? record.to),
    departureDate: asString(record.departureDate ?? record.date),
    departureTime: asString(record.departureTime ?? record.time),
  };
};

export const normalizeUserRatingItem = (
  value: unknown,
  index = 0,
): UserRatingItem | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const rating = resolveRatingValue(record);
  if (rating == null) {
    return null;
  }

  const taskId = asString(record.taskId);
  const rideNode = asRecord(record.ride);
  const rideId = asString(record.rideId ?? rideNode?.rideId);
  const fromUser = asRecord(record.fromUser);
  const toUser = asRecord(record.toUser);
  const createdAt =
    asString(record.createdAt) ||
    asString(record.ratedAt) ||
    asString(record.submittedAt) ||
    asString(record.updatedAt) ||
    undefined;

  const id =
    asString(record.id ?? record._id ?? record.ratingId) ||
    taskId ||
    `${rideId || 'rating'}-${createdAt || index}`;

  const ride = normalizeRideContext(record.ride);
  const source = asString(record.source ?? ride?.source);
  const destination = asString(record.destination ?? ride?.destination);
  const rideLabel =
    source && destination
      ? `${source} → ${destination}`
      : source || destination || undefined;

  const reviewerName =
    readNestedString(record, 'fromUser') ||
    readNestedString(record, 'ratedBy') ||
    readNestedString(record, 'rater') ||
    readNestedString(record, 'submittedBy') ||
    readNestedString(record, 'reviewer') ||
    asString(record.fromUserName) ||
    asString(record.ratedByName) ||
    asString(record.raterName) ||
    asString(record.reviewerName);

  const reviewerPhoto =
    readNestedPhoto(record, 'fromUser') ||
    readNestedPhoto(record, 'ratedBy') ||
    readNestedPhoto(record, 'rater') ||
    readNestedPhoto(record, 'submittedBy') ||
    readNestedPhoto(record, 'reviewer') ||
    asString(record.fromUserPhoto) ||
    asString(record.ratedByPhoto) ||
    asString(record.raterPhoto) ||
    asString(record.reviewerPhoto);

  const commentRaw = record.comment ?? record.feedback ?? record.review;
  const comment =
    typeof commentRaw === 'string' && commentRaw.trim() ? commentRaw.trim() : null;

  return {
    id,
    taskId: taskId || undefined,
    rating,
    comment,
    createdAt,
    rideId: rideId || ride?.rideId || undefined,
    fromUser: fromUser
      ? {
          userId: asString(fromUser.userId) || undefined,
          userName: asString(fromUser.userName) || undefined,
          userPhoto:
            typeof fromUser.userPhoto === 'string' ? fromUser.userPhoto : fromUser.userPhoto ?? null,
        }
      : undefined,
    toUser: toUser
      ? {
          userId: asString(toUser.userId) || undefined,
          userName: asString(toUser.userName) || undefined,
          userPhoto:
            typeof toUser.userPhoto === 'string' ? toUser.userPhoto : toUser.userPhoto ?? null,
        }
      : undefined,
    reviewerName: reviewerName || undefined,
    reviewerPhoto: reviewerPhoto || undefined,
    rideLabel,
    role: resolveRole(record),
  };
};

const ARRAY_KEYS = [
  'items',
  'ratings',
  'data',
  'results',
  'reviews',
  'history',
  'receivedRatings',
  'content',
] as const;

const unwrapPayloadNode = (payload: unknown, depth = 0): unknown[] => {
  if (depth > 4) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  for (const key of ARRAY_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of ['data', 'result', 'payload', 'response'] as const) {
    const nested = record[key];
    if (nested === payload) {
      continue;
    }
    const fromNested = unwrapPayloadNode(nested, depth + 1);
    if (fromNested.length > 0) {
      return fromNested;
    }
  }

  return [];
};

const parseOptionalNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

export const unwrapUserRatingsPage = (payload: unknown): UserRatingsPage => {
  const record = asRecord(payload);
  const rawItems = unwrapPayloadNode(payload);
  const items = rawItems
    .map((item, index) => normalizeUserRatingItem(item, index))
    .filter((item): item is UserRatingItem => item != null);

  const averageRating = parseOptionalNumber(
    record?.averageRating ?? record?.average ?? record?.avgRating ?? record?.ratingAverage,
  );
  const total = parseOptionalNumber(
    record?.total ??
      record?.totalRatings ??
      record?.count ??
      record?.totalCount,
  );
  const direction =
    typeof record?.direction === 'string' && record.direction.trim()
      ? record.direction.trim()
      : undefined;

  return {
    items,
    averageRating,
    total: total ?? items.length,
    totalRatings: parseOptionalNumber(record?.totalRatings) ?? total ?? items.length,
    direction,
  };
};

export const unwrapUserRatings = (payload: unknown): UserRatingItem[] =>
  unwrapUserRatingsPage(payload).items;
