import type { ApiError } from '@/network';

import type {
  ReferralListItemDto,
  ReferralPageDto,
  ReferralReferredUserDto,
  ReferralStatus,
  ReferralSummaryDto,
} from '../api/referrals.types';
import { formatCoinString } from './walletCoin';

export const REFERRAL_ERROR_MESSAGES = {
  REFERRAL_CODE_INVALID: 'Invalid referral code. Please check and try again.',
  SELF_REFERRAL_NOT_ALLOWED: 'You cannot use your own referral code.',
  NETWORK: 'Unable to connect. Please try again.',
  SESSION: 'Your session expired. Please sign in again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

export const REFERRAL_STATUS_LABEL: Record<string, string> = {
  REWARDED: 'Rewarded',
};

export interface ReferralListItemUi {
  id: string;
  name: string;
  profilePhoto: string | null;
  detail: string;
  amountLabel: string;
  status: ReferralStatus;
  statusLabel: string;
}

export interface ReferralSummaryUi {
  referralCode: string;
  totalReferrals: number;
  totalCoinsEarned: string;
  totalCoinsEarnedLabel: string;
}

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

export const normalizeReferralCodeInput = (value: string): string =>
  value.trim().toUpperCase();

/** Optional field — empty after normalize means omit from the verify payload. */
export const normalizeOptionalReferralCode = (value: string | undefined | null): string | undefined => {
  const normalized = normalizeReferralCodeInput(String(value ?? ''));
  return normalized.length ? normalized : undefined;
};

/** Basic client check only — backend remains authoritative. */
export const isPlausibleReferralCode = (value: string): boolean => {
  const code = normalizeReferralCodeInput(value);
  if (!code) {
    return true;
  }
  return /^BHW[A-Z0-9]{6}$/i.test(code) || (code.length >= 6 && code.length <= 16);
};

export const formatReferralJoinedDay = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const mapReferralStatusLabel = (status: ReferralStatus): string => {
  const key = String(status ?? '').trim().toUpperCase();
  return REFERRAL_STATUS_LABEL[key] ?? (key || 'Pending');
};

export const mapReferralSummary = (dto: ReferralSummaryDto): ReferralSummaryUi => ({
  referralCode: String(dto.referralCode ?? '').trim(),
  totalReferrals:
    typeof dto.totalReferrals === 'number' && Number.isFinite(dto.totalReferrals)
      ? dto.totalReferrals
      : Number.parseInt(String(dto.totalReferrals ?? '0'), 10) || 0,
  totalCoinsEarned: String(dto.totalCoinsEarned ?? '0'),
  totalCoinsEarnedLabel: `${formatCoinString(String(dto.totalCoinsEarned ?? '0'))} Coins`,
});

export const mapReferralListItem = (dto: ReferralListItemDto): ReferralListItemUi => {
  const name = asNullableString(dto.referredUser?.name) ?? 'BhaiWay user';
  const reward = String(dto.rewardCoins ?? '0');
  return {
    id: dto.id,
    name,
    profilePhoto: asNullableString(dto.referredUser?.profilePhoto),
    detail: `Joined ${formatReferralJoinedDay(dto.createdAt)}`,
    amountLabel: `+${formatCoinString(reward)} Coins`,
    status: dto.status,
    statusLabel: mapReferralStatusLabel(dto.status),
  };
};

export const normalizeReferredUser = (raw: unknown): ReferralReferredUserDto => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? '').trim(),
    name: asNullableString(row.name),
    profilePhoto: asNullableString(row.profilePhoto ?? row.avatarUri ?? row.photo),
  };
};

export const normalizeReferralListItem = (raw: unknown): ReferralListItemDto | null => {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = String(row.id ?? '').trim();
  if (!id) {
    return null;
  }
  return {
    id,
    referredUser: normalizeReferredUser(row.referredUser ?? row.user),
    rewardCoins: String(row.rewardCoins ?? row.coins ?? '0'),
    status: String(row.status ?? 'REWARDED').toUpperCase(),
    createdAt: String(row.createdAt ?? ''),
    rewardedAt: row.rewardedAt != null ? String(row.rewardedAt) : null,
  };
};

export const normalizeReferralSummary = (payload: unknown): ReferralSummaryDto => {
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const source = nested ?? root ?? {};
  return {
    referralCode: String(source.referralCode ?? '').trim(),
    totalReferrals:
      typeof source.totalReferrals === 'number'
        ? source.totalReferrals
        : Number.parseInt(String(source.totalReferrals ?? '0'), 10) || 0,
    totalCoinsEarned: String(source.totalCoinsEarned ?? '0'),
  };
};

export const normalizeReferralPage = (
  payload: unknown,
  query: { page?: number; limit?: number },
): ReferralPageDto => {
  const limit = Math.max(1, Math.floor(query.limit ?? 20));
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const root = asRecord(payload);
  const nested = root ? asRecord(root.data) : null;
  const source = nested ?? root;

  let itemsRaw: unknown[] = [];
  if (Array.isArray(payload)) {
    itemsRaw = payload;
  } else if (source) {
    for (const key of ['items', 'referrals', 'results', 'rows'] as const) {
      const list = source[key];
      if (Array.isArray(list)) {
        itemsRaw = list;
        break;
      }
    }
  }

  const items = itemsRaw
    .map(normalizeReferralListItem)
    .filter(Boolean) as ReferralListItemDto[];

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

export const buildReferralShareMessage = (code: string): string =>
  [
    'Join me on BhaiWay! 🚗',
    '',
    `Use my referral code ${code} when you register and we both get 50 BhaiWay Coins 🎉`,
    '',
    'Happy riding with BhaiWay!',
  ].join('\n');

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

/** Map referral / auth-verify referral errors to friendly copy. */
export const mapReferralError = (error: unknown): string => {
  const code = getErrorCode(error);
  const status = getErrorStatus(error);
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  const haystack = `${code} ${message}`.toUpperCase();

  if (status === 401 || code === 'HTTP_401') {
    return REFERRAL_ERROR_MESSAGES.SESSION;
  }
  if (code === 'REFERRAL_CODE_INVALID' || haystack.includes('REFERRAL_CODE_INVALID')) {
    return REFERRAL_ERROR_MESSAGES.REFERRAL_CODE_INVALID;
  }
  if (
    code === 'SELF_REFERRAL_NOT_ALLOWED' ||
    haystack.includes('SELF_REFERRAL')
  ) {
    return REFERRAL_ERROR_MESSAGES.SELF_REFERRAL_NOT_ALLOWED;
  }
  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return REFERRAL_ERROR_MESSAGES.NETWORK;
  }
  return REFERRAL_ERROR_MESSAGES.UNKNOWN;
};

/** True when verify failed specifically due to referral code (user can correct it). */
export const isReferralCodeAuthError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  const haystack = `${code} ${message}`.toUpperCase();
  return (
    code === 'REFERRAL_CODE_INVALID' ||
    code === 'SELF_REFERRAL_NOT_ALLOWED' ||
    haystack.includes('REFERRAL_CODE_INVALID') ||
    haystack.includes('SELF_REFERRAL')
  );
};
