/**
 * Local-store helpers for the current user's profile and wallet.
 * All reads/writes go through device AsyncStorage-backed stores (no remote sheet).
 */
import { authSession } from '@/store';
import { formatBhaiWayCoins } from '@/shared/utils';

import { userDetailsSheetStore } from './userDetailsSheetStore';
import { userDetailsSheetSync, walletTransactionsSheetSync } from './sheet';
import type { UserDetailsSheetRow } from './userDetailsSheet.types';
import type {
  WalletTransactionSheetIcon,
  WalletTransactionSheetType,
} from './walletTransactionsSheet.types';
import type { WalletTransactionSyncResult } from './sheet';

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeKey = (value?: string | null): string =>
  (value ?? '').trim().toLowerCase();

/** Find the current session user's local profile row (mobile → email → name). */
export const findCurrentUserSheetRow = (): UserDetailsSheetRow | undefined => {
  const user = authSession.getUser();
  const rows = userDetailsSheetStore.getAll();
  if (rows.length === 0) {
    return undefined;
  }

  const mobile = normalizeMobile(user?.phone);
  if (mobile) {
    const byMobile = rows.find((row) => normalizeMobile(row.mobile) === mobile);
    if (byMobile) {
      return byMobile;
    }
  }

  const email = normalizeKey(user?.email);
  if (email) {
    const byEmail = rows.find((row) => normalizeKey(row.email) === email);
    if (byEmail) {
      return byEmail;
    }
  }

  const name = normalizeKey(user?.fullName);
  if (name) {
    const byName = rows.find((row) => normalizeKey(row.userName) === name);
    if (byName) {
      return byName;
    }
  }

  return undefined;
};

/** Find a registered user in the local store by mobile number. */
export const findSheetUserByMobile = async (
  phone?: string | null,
): Promise<UserDetailsSheetRow | undefined> => {
  const mobile = normalizeMobile(phone);
  if (!mobile) {
    return undefined;
  }

  await userDetailsSheetStore.hydrate();

  const local = userDetailsSheetStore
    .getAll()
    .find((row) => normalizeMobile(row.mobile) === mobile);
  if (local?.userName?.trim() || (local && local.userId > 0)) {
    return local;
  }

  return undefined;
};

/**
 * Login is allowed only when this mobile already exists locally.
 * Signup creates the first row via complete profile.
 */
export const assertSheetUserForLogin = async (phone?: string | null): Promise<UserDetailsSheetRow> => {
  const row = await findSheetUserByMobile(phone);
  if (!row) {
    throw Object.assign(
      new Error('No account found for this number. Please sign up first.'),
      { code: 'SHEET_USER_NOT_FOUND' },
    );
  }
  return row;
};

/** BhaiWayWallet amount for the logged-in user (from local store). */
export const getBhaiWayWalletBalance = (): number => {
  const row = findCurrentUserSheetRow();
  const amount = row?.bhaiWayWallet ?? 0;
  return Number.isFinite(amount) ? amount : 0;
};

export const formatBhaiWayWalletLabel = (amount = getBhaiWayWalletBalance()): string =>
  formatBhaiWayCoins(amount);

export const subscribeBhaiWayWallet = (onStoreChange: () => void): (() => void) => {
  const unsubSheet = userDetailsSheetStore.subscribe(() => onStoreChange());
  const unsubAuth = authSession.subscribe(() => onStoreChange());
  return () => {
    unsubSheet();
    unsubAuth();
  };
};

/** Set/add wallet amount on the current user's local profile row. */
export const updateBhaiWayWalletBalance = async (
  nextAmount: number,
  options?: { mode?: 'set' | 'add' },
): Promise<number> => {
  const mode = options?.mode ?? 'set';
  const user = authSession.getUser();
  const existing = findCurrentUserSheetRow();
  const current = existing?.bhaiWayWallet ?? 0;
  const amount = mode === 'add' ? current + nextAmount : nextAmount;
  const safeAmount = Math.max(0, Number.isFinite(amount) ? amount : 0);

  await userDetailsSheetSync.validateAndSync({
    userId: existing?.userId,
    userName: existing?.userName || user?.fullName?.trim() || 'User',
    email: existing?.email || user?.email || '',
    aadharNumber: existing?.aadharNumber,
    corporateId: existing?.corporateId,
    mobile: existing?.mobile || user?.phone || '',
    vehicleModel: existing?.vehicleModel,
    vehicleColor: existing?.vehicleColor,
    vehicleType: existing?.vehicleType,
    vehicleNumberPlate: existing?.vehicleNumberPlate,
    bhaiWayWallet: safeAmount,
    profilePicture: existing?.profilePicture,
    rc: existing?.rc,
    corporateIdUrl: existing?.corporateIdUrl,
    role: existing?.role,
  });

  return safeAmount;
};

/** Append one wallet credit/debit row locally. */
export const recordWalletTransaction = async (input: {
  title: string;
  amount: number;
  type: WalletTransactionSheetType;
  icon?: WalletTransactionSheetIcon;
  reference?: string;
  dateLabel?: string;
}): Promise<WalletTransactionSyncResult> =>
  walletTransactionsSheetSync.upsertAndSync({
    title: input.title,
    amount: input.amount,
    type: input.type,
    icon: input.icon,
    reference: input.reference,
    dateLabel: input.dateLabel,
  });

/**
 * Apply local profile row (name, phone, Cloudinary profile picture) onto the auth session.
 * Call after login / hydrate so returning users see the same photo.
 */
export const applySheetProfileToSession = (): UserDetailsSheetRow | undefined => {
  const row = findCurrentUserSheetRow();
  const user = authSession.getUser();
  const token = authSession.getToken();
  if (!row || !user || !token) {
    return row;
  }

  authSession.setSession(token, {
    ...user,
    fullName: row.userName?.trim() || user.fullName,
    firstName: user.firstName ?? (row.userName?.trim().split(/\s+/)[0] ?? null),
    email: row.email?.trim() || user.email,
    avatarUri: row.profilePicture?.trim() || user.avatarUri,
    phone: row.mobile?.trim() || user.phone,
  }, null, authSession.getProfileCompleted());

  return row;
};

/** Hydrate local profile store, then restore session profile fields. */
export const hydrateSessionFromSheet = async (): Promise<UserDetailsSheetRow | undefined> => {
  try {
    await userDetailsSheetStore.hydrate();
  } catch {
    // ignore
  }
  return applySheetProfileToSession();
};
