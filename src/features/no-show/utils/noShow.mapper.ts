import type { ApiError } from '@/network';

import type {
  NoShowClaimDto,
  NoShowClaimEffectDto,
  NoShowClaimKind,
  NoShowClaimStatus,
  NoShowDecisionSource,
  NoShowSupportHintDto,
} from '../api/noShow.types';

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

/**
 * Backend returns the claim DTO at the HTTP root.
 * Still accept `{ data }`, `{ claim }`, `{ data: { claim } }` without inventing fields.
 */
export const unwrapNoShowClaimRoot = (payload: unknown): Record<string, unknown> | null => {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }
  const data = asRecord(root.data);
  const nestedClaim = asRecord(root.claim) ?? asRecord(data?.claim);
  if (nestedClaim && asString(nestedClaim.id)) {
    return nestedClaim;
  }
  if (data && asString(data.id)) {
    return data;
  }
  if (asString(root.id)) {
    return root;
  }
  return data ?? root;
};

export const isNoShowUuid = (value: unknown): boolean => UUID_RE.test(asString(value));

export const asNoShowClaimStatus = (value: unknown): NoShowClaimStatus | string => {
  const raw = asString(value).toUpperCase();
  if (
    raw === 'PENDING' ||
    raw === 'APPROVED' ||
    raw === 'REJECTED' ||
    raw === 'SUPERSEDED'
  ) {
    return raw;
  }
  return raw || 'PENDING';
};

export const asNoShowClaimKind = (value: unknown): NoShowClaimKind | string => {
  const raw = asString(value).toUpperCase();
  if (raw === 'DRIVER_NO_SHOW' || raw === 'PASSENGER_NO_SHOW') {
    return raw;
  }
  return raw;
};

const asDecisionSource = (value: unknown): NoShowDecisionSource | string | null => {
  const raw = asNullableString(value);
  if (!raw) {
    return null;
  }
  const upper = raw.toUpperCase();
  if (upper === 'RESPONDENT' || upper === 'TIMEOUT') {
    return upper;
  }
  return upper;
};

const normalizeSupportHint = (value: unknown): NoShowSupportHintDto | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const message = asNullableString(record.message);
  const category = asNullableString(record.category);
  const subcategory = asNullableString(record.subcategory);
  const ticketId = asNullableString(record.ticketId) ?? asNullableString(record.ticket_id);
  if (!message && !category && !subcategory && !ticketId) {
    return null;
  }
  return {
    category: category ?? '',
    subcategory: subcategory ?? '',
    message: message ?? '',
    ticketId: ticketId && isNoShowUuid(ticketId) ? ticketId : ticketId,
  };
};

const normalizeEffect = (value: unknown): NoShowClaimEffectDto | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const kind = asString(record.kind);
  if (!kind) {
    return null;
  }
  return {
    kind,
    status: asString(record.status) || 'PENDING',
    attemptCount: asInt(record.attemptCount, 0),
    nextAttemptAt: asNullableString(record.nextAttemptAt),
    lastError: asNullableString(record.lastError),
    completedAt: asNullableString(record.completedAt),
  };
};

const readClaimantName = (root: Record<string, unknown>): string | null => {
  const direct =
    asNullableString(root.claimantName) ??
    asNullableString(root.claimantDisplayName) ??
    asNullableString(root.claimant_name);
  if (direct) {
    return direct;
  }
  const nested = asRecord(root.claimant);
  if (!nested) {
    return null;
  }
  return (
    asNullableString(nested.displayName) ??
    asNullableString(nested.fullName) ??
    asNullableString(nested.name)
  );
};

export const normalizeNoShowClaim = (payload: unknown): NoShowClaimDto | null => {
  const root = unwrapNoShowClaimRoot(payload);
  if (!root) {
    return null;
  }
  const id = asString(root.id);
  const rideId = asString(root.rideId) || asString(root.ride_id);
  if (!isNoShowUuid(id) || !isNoShowUuid(rideId)) {
    return null;
  }
  const bookingRaw = asNullableString(root.bookingId) ?? asNullableString(root.booking_id);
  const effectsRaw = Array.isArray(root.effects) ? root.effects : [];

  return {
    id,
    rideId,
    bookingId: bookingRaw && isNoShowUuid(bookingRaw) ? bookingRaw : bookingRaw,
    rideType: asString(root.rideType) || asString(root.ride_type) || '',
    kind: asNoShowClaimKind(root.kind),
    claimantUserId: asString(root.claimantUserId) || asString(root.claimant_user_id),
    respondentUserId: asString(root.respondentUserId) || asString(root.respondent_user_id),
    status: asNoShowClaimStatus(root.status),
    respondBy: asString(root.respondBy) || asString(root.respond_by),
    respondedAt: asNullableString(root.respondedAt) ?? asNullableString(root.responded_at),
    respondedByUserId:
      asNullableString(root.respondedByUserId) ?? asNullableString(root.responded_by_user_id),
    decisionSource: asDecisionSource(root.decisionSource ?? root.decision_source),
    settledAt: asNullableString(root.settledAt) ?? asNullableString(root.settled_at),
    settlementIdempotencyKey:
      asNullableString(root.settlementIdempotencyKey) ??
      asNullableString(root.settlement_idempotency_key),
    supportTicketId:
      asNullableString(root.supportTicketId) ?? asNullableString(root.support_ticket_id),
    createdAt: asString(root.createdAt) || asString(root.created_at),
    updatedAt: asString(root.updatedAt) || asString(root.updated_at),
    alreadyOpen: asBool(root.alreadyOpen ?? root.already_open, false),
    support: normalizeSupportHint(root.support),
    effects: effectsRaw.map(normalizeEffect).filter((item): item is NoShowClaimEffectDto =>
      Boolean(item),
    ),
    claimantName: readClaimantName(root),
  };
};

export const extractNoShowErrorSupport = (error: unknown): NoShowSupportHintDto | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const details = (error as ApiError).details;
  const record = asRecord(details);
  if (!record) {
    return null;
  }
  return normalizeSupportHint(record.support);
};

export const isNoShowAlreadyRejectedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = asString((error as ApiError).code);
  if (code === 'NO_SHOW_CLAIM_ALREADY_REJECTED') {
    return true;
  }
  const details = asRecord((error as ApiError).details);
  return asString(details?.code) === 'NO_SHOW_CLAIM_ALREADY_REJECTED';
};

export const formatNoShowStatusLabel = (status: string): string => {
  const raw = asString(status).toUpperCase();
  switch (raw) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'SUPERSEDED':
      return 'Closed';
    default:
      return raw
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
  }
};

export const formatNoShowKindLabel = (kind: string): string => {
  const raw = asString(kind).toUpperCase();
  if (raw === 'DRIVER_NO_SHOW') {
    return 'Driver no-show';
  }
  if (raw === 'PASSENGER_NO_SHOW') {
    return 'Passenger no-show';
  }
  return raw
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

export const parseRespondByMs = (respondBy: string | null | undefined): number | null => {
  const text = asString(respondBy);
  if (!text) {
    return null;
  }
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

export const formatRespondByLabel = (respondBy: string | null | undefined): string | null => {
  const ms = parseRespondByMs(respondBy);
  if (ms == null) {
    return null;
  }
  return new Date(ms).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const remainingRespondMs = (
  respondBy: string | null | undefined,
  nowMs: number = Date.now(),
): number | null => {
  const deadline = parseRespondByMs(respondBy);
  if (deadline == null) {
    return null;
  }
  return Math.max(0, deadline - nowMs);
};

export const formatRemainingRespondLabel = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
