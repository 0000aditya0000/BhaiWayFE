import type {
  EligibleSupportRideDto,
  EligibleSupportRidePageDto,
  SupportAttachmentDto,
  SupportCommentAuthorType,
  SupportCommentDto,
  SupportRelatedRideSummaryDto,
  SupportStatusHistoryDto,
  SupportTicketCategory,
  SupportTicketDetailDto,
  SupportTicketListItemDto,
  SupportTicketPageDto,
  SupportTicketStatus,
} from '../api/support.types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

const asNullableString = (value: unknown): string | null => {
  const text = asString(value);
  return text.length > 0 ? text : null;
};

const asBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === '0') {
      return false;
    }
  }
  return fallback;
};

const asInt = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return fallback;
};

const unwrapRoot = (payload: unknown): Record<string, unknown> | null => {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }
  const nested = asRecord(root.data);
  return nested ?? root;
};

export const isSupportUuid = (value: unknown): boolean => UUID_RE.test(asString(value));

export const asSupportTicketCategory = (value: unknown): SupportTicketCategory | string => {
  const raw = asString(value).toUpperCase();
  if (
    raw === 'BOOKINGS_AND_RIDES' ||
    raw === 'PAYMENTS_AND_WALLETS' ||
    raw === 'OTHERS'
  ) {
    return raw;
  }
  return raw || 'OTHERS';
};

export const asSupportTicketStatus = (value: unknown): SupportTicketStatus | string => {
  const raw = asString(value).toUpperCase();
  if (raw === 'CREATED' || raw === 'IN_PROGRESS' || raw === 'RESOLVED') {
    return raw;
  }
  return raw || 'CREATED';
};

export const asSupportCommentAuthorType = (
  value: unknown,
): SupportCommentAuthorType | string => {
  const raw = asString(value).toUpperCase();
  if (raw === 'USER' || raw === 'ADMIN') {
    return raw;
  }
  return raw || 'USER';
};

export const normalizeSupportAttachment = (raw: unknown): SupportAttachmentDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = asString(row.id);
  const url = asString(row.url);
  if (!id || !url) {
    return null;
  }
  return {
    id,
    url,
    contentType: asString(row.contentType ?? row.content_type) || 'image/jpeg',
    createdAt: asString(row.createdAt ?? row.created_at) || new Date(0).toISOString(),
  };
};

export const normalizeSupportComment = (raw: unknown): SupportCommentDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = asString(row.id);
  const message = asString(row.message);
  if (!id || !message) {
    return null;
  }
  return {
    id,
    authorType: asSupportCommentAuthorType(row.authorType ?? row.author_type),
    authorUserId: asString(row.authorUserId ?? row.author_user_id),
    message,
    createdAt: asString(row.createdAt ?? row.created_at) || new Date(0).toISOString(),
  };
};

export const normalizeSupportStatusHistory = (
  raw: unknown,
): SupportStatusHistoryDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = asString(row.id);
  const toStatus = asSupportTicketStatus(row.toStatus ?? row.to_status);
  if (!id || !toStatus) {
    return null;
  }
  const fromRaw = row.fromStatus ?? row.from_status;
  return {
    id,
    fromStatus: fromRaw == null || fromRaw === '' ? null : asSupportTicketStatus(fromRaw),
    toStatus,
    changedByAdmin: asBool(row.changedByAdmin ?? row.changed_by_admin, false),
    createdAt: asString(row.createdAt ?? row.created_at) || new Date(0).toISOString(),
  };
};

export const normalizeRelatedRideSummary = (
  raw: unknown,
): SupportRelatedRideSummaryDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const rideId = asString(row.rideId ?? row.ride_id);
  if (!rideId) {
    return null;
  }
  return {
    rideId,
    bookingId: asNullableString(row.bookingId ?? row.booking_id),
    source: asString(row.source),
    destination: asString(row.destination),
    departureDate: asString(row.departureDate ?? row.departure_date),
    departureTime: asString(row.departureTime ?? row.departure_time),
    rideStatus: asString(row.rideStatus ?? row.ride_status),
    role: asNullableString(row.role),
  };
};

export const normalizeSupportTicketListItem = (
  raw: unknown,
): SupportTicketListItemDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = asString(row.id);
  if (!id) {
    return null;
  }
  return {
    id,
    reference: asString(row.reference) || id,
    category: asSupportTicketCategory(row.category),
    subcategory: asString(row.subcategory),
    subject: asString(row.subject) || 'Support ticket',
    status: asSupportTicketStatus(row.status),
    relatedRideId: asNullableString(row.relatedRideId ?? row.related_ride_id),
    relatedBookingId: asNullableString(row.relatedBookingId ?? row.related_booking_id),
    createdAt: asString(row.createdAt ?? row.created_at) || new Date(0).toISOString(),
    updatedAt: asString(row.updatedAt ?? row.updated_at) || new Date(0).toISOString(),
    resolvedAt: asNullableString(row.resolvedAt ?? row.resolved_at),
  };
};

export const normalizeSupportTicketDetail = (
  raw: unknown,
): SupportTicketDetailDto | null => {
  const root = unwrapRoot(raw) ?? asRecord(raw);
  if (!root) {
    return null;
  }
  const base = normalizeSupportTicketListItem(root);
  if (!base) {
    return null;
  }

  const attachmentsRaw = Array.isArray(root.attachments) ? root.attachments : [];
  const commentsRaw = Array.isArray(root.comments) ? root.comments : [];
  const historyRaw = Array.isArray(root.statusHistory)
    ? root.statusHistory
    : Array.isArray(root.status_history)
      ? root.status_history
      : [];

  return {
    ...base,
    description: asString(root.description),
    relatedWalletTransactionId: asNullableString(
      root.relatedWalletTransactionId ?? root.related_wallet_transaction_id,
    ),
    attachments: attachmentsRaw
      .map(normalizeSupportAttachment)
      .filter((item): item is SupportAttachmentDto => item != null),
    comments: commentsRaw
      .map(normalizeSupportComment)
      .filter((item): item is SupportCommentDto => item != null),
    statusHistory: historyRaw
      .map(normalizeSupportStatusHistory)
      .filter((item): item is SupportStatusHistoryDto => item != null),
    relatedRide: normalizeRelatedRideSummary(root.relatedRide ?? root.related_ride),
  };
};

export const normalizeSupportTicketPage = (
  payload: unknown,
  fallback: { page: number; limit: number },
): SupportTicketPageDto => {
  const source = unwrapRoot(payload);
  const itemsRaw = Array.isArray(source?.items)
    ? source!.items
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  const items = itemsRaw
    .map(normalizeSupportTicketListItem)
    .filter((item): item is SupportTicketListItemDto => item != null);

  const page = asInt(source?.page, fallback.page) || fallback.page;
  const limit = asInt(source?.limit, fallback.limit) || fallback.limit;
  const total = asInt(source?.total, items.length);
  const totalPages =
    asInt(source?.totalPages ?? source?.total_pages, 0) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { items, page, limit, total, totalPages };
};

export const normalizeEligibleSupportRide = (
  raw: unknown,
): EligibleSupportRideDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const rideId = asString(row.rideId ?? row.ride_id);
  if (!rideId) {
    return null;
  }
  return {
    rideId,
    bookingId: asNullableString(row.bookingId ?? row.booking_id),
    role: asString(row.role).toUpperCase() || 'PASSENGER',
    source: asString(row.source),
    destination: asString(row.destination),
    departureDate: asString(row.departureDate ?? row.departure_date),
    departureTime: asString(row.departureTime ?? row.departure_time),
    rideStatus: asString(row.rideStatus ?? row.ride_status),
    bookingStatus: asNullableString(row.bookingStatus ?? row.booking_status),
    rideType: asString(row.rideType ?? row.ride_type),
  };
};

export const normalizeEligibleSupportRidePage = (
  payload: unknown,
  fallback: { page: number; limit: number },
): EligibleSupportRidePageDto => {
  const source = unwrapRoot(payload);
  const itemsRaw = Array.isArray(source?.items)
    ? source!.items
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  const items = itemsRaw
    .map(normalizeEligibleSupportRide)
    .filter((item): item is EligibleSupportRideDto => item != null);

  const page = asInt(source?.page, fallback.page) || fallback.page;
  const limit = asInt(source?.limit, fallback.limit) || fallback.limit;
  const total = asInt(source?.total, items.length);
  const totalPages =
    asInt(source?.totalPages ?? source?.total_pages, 0) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { items, page, limit, total, totalPages };
};

export const mergeSupportTicketsWithoutDuplicates = (
  existing: SupportTicketListItemDto[],
  incoming: SupportTicketListItemDto[],
): SupportTicketListItemDto[] => {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
};

export const mergeEligibleRidesWithoutDuplicates = (
  existing: EligibleSupportRideDto[],
  incoming: EligibleSupportRideDto[],
): EligibleSupportRideDto[] => {
  const keyOf = (ride: EligibleSupportRideDto): string =>
    `${ride.rideId}:${ride.bookingId ?? ''}:${ride.role}`;
  const seen = new Set(existing.map(keyOf));
  const merged = [...existing];
  for (const item of incoming) {
    const key = keyOf(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }
  return merged;
};
