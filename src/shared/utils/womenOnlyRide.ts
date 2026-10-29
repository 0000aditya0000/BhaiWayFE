import type { ApiError } from '@/network/network.types';
import type { ApiGender } from '@/features/auth/types';

/** Backend booking rejection for Women Only rides. */
export const WOMEN_ONLY_RIDE_ERROR_CODE = 'WOMEN_ONLY_RIDE' as const;

export const WOMEN_ONLY_RIDE_MESSAGE =
  'This ride is Women Only. Only verified female riders can book this ride.' as const;

export const WOMEN_ONLY_BADGE_LABEL = 'WOMEN ONLY' as const;

export const WOMEN_ONLY_FEATURE = {
  id: 'women-only',
  label: WOMEN_ONLY_BADGE_LABEL,
  icon: 'woman-outline',
} as const;

type PreferencesLike = {
  womenOnly?: boolean | null;
} | null | undefined;

type WomenOnlySource = {
  womenOnly?: boolean | null;
  preferences?: PreferencesLike;
} | null | undefined;

/** Resolve womenOnly from top-level or nested preferences (backend may expose either). */
export const resolveWomenOnly = (source: WomenOnlySource): boolean => {
  if (!source) {
    return false;
  }
  if (typeof source.womenOnly === 'boolean') {
    return source.womenOnly;
  }
  if (typeof source.preferences?.womenOnly === 'boolean') {
    return source.preferences.womenOnly;
  }
  return false;
};

/** Only verified FEMALE riders may book Women Only rides (UX helper — backend is authoritative). */
export const canBookWomenOnlyRide = (gender: ApiGender | null | undefined): boolean =>
  gender === 'FEMALE';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

/** Prefer structured API error code over human-readable message matching. */
export const extractApiErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return '';
  }
  const apiError = error as ApiError;
  const details = asRecord(apiError.details);
  const nested = details ? asRecord(details.error) : null;
  const candidates = [
    details?.code,
    details?.errorCode,
    nested?.code,
    apiError.code,
  ];
  return (
    candidates
      .map((value) => String(value ?? '').trim().toUpperCase())
      .find((value) => value.length > 0 && !value.startsWith('HTTP_')) ??
    candidates
      .map((value) => String(value ?? '').trim().toUpperCase())
      .find((value) => value.length > 0) ??
    ''
  );
};

export const isWomenOnlyRideError = (error: unknown): boolean => {
  const code = extractApiErrorCode(error);
  if (code === WOMEN_ONLY_RIDE_ERROR_CODE || code.includes(WOMEN_ONLY_RIDE_ERROR_CODE)) {
    return true;
  }
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  return message.toUpperCase().includes(WOMEN_ONLY_RIDE_ERROR_CODE);
};

export const formatApiGenderLabel = (gender: ApiGender | string | null | undefined): string => {
  const normalized = (gender || '').trim().toUpperCase();
  switch (normalized) {
    case 'MALE':
      return 'Male';
    case 'FEMALE':
      return 'Female';
    case 'OTHER':
      return 'Other';
    case 'PREFER_NOT_TO_SAY':
      return 'Prefer not to say';
    default:
      return 'Not verified yet';
  }
};
