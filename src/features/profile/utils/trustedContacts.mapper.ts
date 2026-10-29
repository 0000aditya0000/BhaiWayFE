import type { ApiError } from '@/network';
import { formatPhoneNumber } from '@/shared/utils/formatter';
import { normalizeAuthPhoneDigits } from '@/features/auth/utils/playReviewLogin';

import type {
  CreateTrustedContactPayload,
  TrustedContactDto,
  TrustedContactPageDto,
  TrustedContactRelationship,
  UpdateTrustedContactPayload,
} from '../api/trustedContacts.types';
import type { TrustedContact } from '../types';

export const TRUSTED_CONTACT_RELATIONSHIPS: readonly TrustedContactRelationship[] = [
  'PARENT',
  'MOTHER',
  'FATHER',
  'BROTHER',
  'SISTER',
  'SPOUSE',
  'PARTNER',
  'FRIEND',
  'RELATIVE',
  'COLLEAGUE',
  'OTHER',
] as const;

export const TRUSTED_CONTACT_RELATIONSHIP_LABEL: Record<TrustedContactRelationship, string> = {
  PARENT: 'Parent',
  MOTHER: 'Mother',
  FATHER: 'Father',
  BROTHER: 'Brother',
  SISTER: 'Sister',
  SPOUSE: 'Spouse',
  PARTNER: 'Partner',
  FRIEND: 'Friend',
  RELATIVE: 'Relative',
  COLLEAGUE: 'Colleague',
  OTHER: 'Other',
};

export const TRUSTED_CONTACT_ERROR_MESSAGES = {
  TRUSTED_CONTACT_NOT_FOUND: 'Trusted contact not found.',
  TRUSTED_CONTACT_ACCESS_DENIED: "You don't have access to this contact.",
  TRUSTED_CONTACT_LIMIT_REACHED: 'You can add up to 5 trusted contacts.',
  INVALID_TRUSTED_CONTACT_NAME: 'Please enter a valid name.',
  INVALID_TRUSTED_CONTACT_PHONE: 'Please enter a valid Indian mobile number.',
  INVALID_TRUSTED_CONTACT_RELATIONSHIP: 'Please select a valid relationship.',
  DUPLICATE_TRUSTED_CONTACT: 'This contact is already in your trusted contacts.',
  NETWORK: 'Unable to connect. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const asNullableString = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
};

export const asTrustedContactRelationship = (
  value: unknown,
): TrustedContactRelationship | null => {
  const raw = String(value ?? '').trim().toUpperCase();
  return (TRUSTED_CONTACT_RELATIONSHIPS as readonly string[]).includes(raw)
    ? (raw as TrustedContactRelationship)
    : null;
};

export const relationshipDisplayLabel = (value: TrustedContactRelationship | string): string => {
  const key = asTrustedContactRelationship(value);
  if (!key) {
    return String(value ?? '').trim() || 'Other';
  }
  return TRUSTED_CONTACT_RELATIONSHIP_LABEL[key];
};

/** Normalize UI phone input → backend E.164 (+91XXXXXXXXXX). */
export const toTrustedContactPhoneNumber = (value: string): string | null => {
  const digits = normalizeAuthPhoneDigits(value);
  if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }
  return `+91${digits}`;
};

export const formatTrustedContactPhoneLabel = (phoneNumber: string): string => {
  const digits = normalizeAuthPhoneDigits(phoneNumber);
  if (digits.length === 10) {
    return `+91 ${formatPhoneNumber(digits)}`;
  }
  return phoneNumber.trim() || '—';
};

export const buildInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

/** Only https remote URLs are valid photoUrl for the backend. */
export const isPersistablePhotoUrl = (value: string | null | undefined): boolean => {
  const url = String(value ?? '').trim();
  if (!url) {
    return false;
  }
  if (url.startsWith('file:') || url.startsWith('content:') || url.startsWith('data:')) {
    return false;
  }
  return /^https:\/\//i.test(url);
};

export const validateTrustedContactForm = (input: {
  name: string;
  phoneLabel: string;
  relationship: TrustedContactRelationship | '';
}):
  | { ok: true; name: string; phoneNumber: string; relationship: TrustedContactRelationship }
  | { ok: false; message: string } => {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) {
    return { ok: false, message: TRUSTED_CONTACT_ERROR_MESSAGES.INVALID_TRUSTED_CONTACT_NAME };
  }
  const phoneNumber = toTrustedContactPhoneNumber(input.phoneLabel);
  if (!phoneNumber) {
    return { ok: false, message: TRUSTED_CONTACT_ERROR_MESSAGES.INVALID_TRUSTED_CONTACT_PHONE };
  }
  const relationship = asTrustedContactRelationship(input.relationship);
  if (!relationship) {
    return {
      ok: false,
      message: TRUSTED_CONTACT_ERROR_MESSAGES.INVALID_TRUSTED_CONTACT_RELATIONSHIP,
    };
  }
  return { ok: true, name, phoneNumber, relationship };
};

export const mapTrustedContactDtoToUi = (dto: TrustedContactDto): TrustedContact => {
  const name = String(dto.name ?? '').trim();
  const relationship = asTrustedContactRelationship(dto.relationship) ?? 'OTHER';
  const photoUrl = asNullableString(dto.photoUrl);
  return {
    id: String(dto.id),
    name,
    relation: relationshipDisplayLabel(relationship),
    relationship,
    phoneLabel: formatTrustedContactPhoneLabel(dto.phoneNumber),
    phoneNumber: String(dto.phoneNumber ?? ''),
    avatarUri: photoUrl && isPersistablePhotoUrl(photoUrl) ? photoUrl : undefined,
    photoUrl,
    initials: buildInitials(name),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
};

export const normalizeTrustedContactDto = (raw: unknown): TrustedContactDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = String(row.id ?? '').trim();
  const relationship = asTrustedContactRelationship(row.relationship);
  if (!id || !relationship) {
    return null;
  }
  return {
    id,
    name: String(row.name ?? '').trim(),
    phoneNumber: String(row.phoneNumber ?? '').trim(),
    relationship,
    photoUrl: asNullableString(row.photoUrl),
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
  };
};

export const normalizeTrustedContactPage = (
  payload: unknown,
  query: { page?: number; limit?: number },
): TrustedContactPageDto => {
  const limit = Math.max(1, Math.floor(query.limit ?? 20));
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const source = nested ?? root;

  let itemsRaw: unknown[] = [];
  if (Array.isArray(payload)) {
    itemsRaw = payload;
  } else if (source) {
    for (const key of ['items', 'contacts', 'results', 'rows'] as const) {
      const list = source[key];
      if (Array.isArray(list)) {
        itemsRaw = list;
        break;
      }
    }
  }

  const items = itemsRaw
    .map(normalizeTrustedContactDto)
    .filter(Boolean) as TrustedContactDto[];

  const totalRaw = source?.total;
  const total =
    typeof totalRaw === 'number' && Number.isFinite(totalRaw) ? totalRaw : items.length;

  return {
    items,
    page: typeof source?.page === 'number' ? source.page : page,
    limit: typeof source?.limit === 'number' ? source.limit : limit,
    total,
  };
};

export const normalizeTrustedContact = (payload: unknown): TrustedContactDto => {
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const dto = normalizeTrustedContactDto(nested ?? root ?? payload);
  if (!dto) {
    throw new Error('Invalid trusted contact response');
  }
  return dto;
};

export const toCreatePayload = (input: {
  name: string;
  phoneNumber: string;
  relationship: TrustedContactRelationship;
  photoUrl?: string | null;
}): CreateTrustedContactPayload => {
  const payload: CreateTrustedContactPayload = {
    name: input.name,
    phoneNumber: input.phoneNumber,
    relationship: input.relationship,
  };
  if (isPersistablePhotoUrl(input.photoUrl)) {
    payload.photoUrl = String(input.photoUrl).trim();
  }
  return payload;
};

export const toUpdatePayload = (input: {
  name: string;
  phoneNumber: string;
  relationship: TrustedContactRelationship;
  photoUrl?: string | null;
}): UpdateTrustedContactPayload => {
  const payload: UpdateTrustedContactPayload = {
    name: input.name,
    phoneNumber: input.phoneNumber,
    relationship: input.relationship,
  };
  if (isPersistablePhotoUrl(input.photoUrl)) {
    payload.photoUrl = String(input.photoUrl).trim();
  } else if (input.photoUrl === null) {
    payload.photoUrl = null;
  }
  return payload;
};

const getErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as ApiError).code;
    if (typeof code === 'string') {
      return code.trim().toUpperCase();
    }
  }
  return '';
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

export const mapTrustedContactError = (error: unknown): string => {
  const code = getErrorCode(error);
  const status = getErrorStatus(error);
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  const haystack = `${code} ${message}`.toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return TRUSTED_CONTACT_ERROR_MESSAGES.SESSION;
  }
  if (code === 'TRUSTED_CONTACT_LIMIT_REACHED' || haystack.includes('LIMIT_REACHED')) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.TRUSTED_CONTACT_LIMIT_REACHED;
  }
  if (code === 'DUPLICATE_TRUSTED_CONTACT' || haystack.includes('DUPLICATE_TRUSTED')) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.DUPLICATE_TRUSTED_CONTACT;
  }
  if (code === 'INVALID_TRUSTED_CONTACT_NAME' || haystack.includes('INVALID_TRUSTED_CONTACT_NAME')) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.INVALID_TRUSTED_CONTACT_NAME;
  }
  if (
    code === 'INVALID_TRUSTED_CONTACT_PHONE' ||
    haystack.includes('INVALID_TRUSTED_CONTACT_PHONE')
  ) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.INVALID_TRUSTED_CONTACT_PHONE;
  }
  if (
    code === 'INVALID_TRUSTED_CONTACT_RELATIONSHIP' ||
    haystack.includes('INVALID_TRUSTED_CONTACT_RELATIONSHIP')
  ) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.INVALID_TRUSTED_CONTACT_RELATIONSHIP;
  }
  if (code === 'TRUSTED_CONTACT_NOT_FOUND' || haystack.includes('TRUSTED_CONTACT_NOT_FOUND')) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.TRUSTED_CONTACT_NOT_FOUND;
  }
  if (
    code === 'TRUSTED_CONTACT_ACCESS_DENIED' ||
    haystack.includes('TRUSTED_CONTACT_ACCESS_DENIED')
  ) {
    return TRUSTED_CONTACT_ERROR_MESSAGES.TRUSTED_CONTACT_ACCESS_DENIED;
  }
  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return TRUSTED_CONTACT_ERROR_MESSAGES.NETWORK;
  }
  return TRUSTED_CONTACT_ERROR_MESSAGES.UNKNOWN;
};
