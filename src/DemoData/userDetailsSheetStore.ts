import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  USER_DETAILS_SHEET_HEADERS,
  USER_DETAILS_USER_ID_START,
  normalizeSheetRole,
  type UserDetailsSheetPatch,
  type UserDetailsSheetRow,
} from './userDetailsSheet.types';

const store = createLocalListStore<UserDetailsSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.userDetailsSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeKey = (value?: string | null): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeAadhaar = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-4) || normalizeKey(value);

const resolveMobile = (explicit?: string | null): string => {
  const fromArg = normalizeMobile(explicit);
  if (fromArg.length >= 10) {
    return fromArg;
  }
  return normalizeMobile(authSession.getUser()?.phone);
};

const emptyRow = (rowId: number, mobile: string, userId: number): UserDetailsSheetRow => ({
  row_id: rowId,
  userId,
  mobile,
  userName: '',
  email: '',
  aadharNumber: '',
  corporateId: '',
  vehicleModel: '',
  vehicleColor: '',
  vehicleType: '',
  vehicleNumberPlate: '',
  bhaiWayWallet: 0,
  profilePicture: '',
  rc: '',
  corporateIdUrl: '',
  role: 'Both',
  updated_at: new Date().toISOString(),
});

const findExisting = (patch: UserDetailsSheetPatch): UserDetailsSheetRow | undefined => {
  const mobile = normalizeMobile(patch.mobile) || resolveMobile(patch.mobile);
  const aadhaar = normalizeAadhaar(patch.aadharNumber);
  const name = normalizeKey(patch.userName);
  const email = normalizeKey(patch.email);
  const userId = patch.userId;

  return store.getAll().find((row) => {
    if (userId != null && userId > 0 && row.userId === userId) {
      return true;
    }
    const rowMobile = normalizeMobile(row.mobile);
    const rowAadhaar = normalizeAadhaar(row.aadharNumber);
    const rowName = normalizeKey(row.userName);
    const rowEmail = normalizeKey(row.email);
    if (mobile && rowMobile && mobile === rowMobile) {
      return true;
    }
    if (email && rowEmail && email === rowEmail) {
      return true;
    }
    if (aadhaar && rowAadhaar && aadhaar === rowAadhaar) {
      return true;
    }
    if (name && rowName && name === rowName) {
      return true;
    }
    return false;
  });
};

const keepText = (next: string | undefined, prev: string): string => {
  const trimmed = next?.trim();
  return trimmed ? trimmed : prev;
};

const mergeRow = (
  base: UserDetailsSheetRow,
  patch: UserDetailsSheetPatch,
  mobile: string,
): UserDetailsSheetRow => ({
  ...base,
  userId: base.userId > 0 ? base.userId : patch.userId ?? base.userId,
  mobile: mobile || base.mobile,
  userName: keepText(patch.userName, base.userName),
  email: keepText(patch.email, base.email),
  aadharNumber: keepText(patch.aadharNumber, base.aadharNumber),
  corporateId: keepText(patch.corporateId, base.corporateId),
  vehicleModel: keepText(patch.vehicleModel, base.vehicleModel),
  vehicleColor: keepText(patch.vehicleColor, base.vehicleColor),
  vehicleType: keepText(patch.vehicleType, base.vehicleType),
  vehicleNumberPlate:
    patch.vehicleNumberPlate?.trim().toUpperCase() || base.vehicleNumberPlate,
  bhaiWayWallet: patch.bhaiWayWallet !== undefined ? patch.bhaiWayWallet : base.bhaiWayWallet,
  profilePicture: keepText(patch.profilePicture, base.profilePicture),
  rc: keepText(patch.rc, base.rc),
  corporateIdUrl: keepText(patch.corporateIdUrl, base.corporateIdUrl),
  role: patch.role ? normalizeSheetRole(patch.role) : base.role || 'Both',
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (row: Partial<UserDetailsSheetRow> & { row_id: number }): UserDetailsSheetRow => ({
  row_id: row.row_id,
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  userName: row.userName ?? '',
  email: row.email ?? '',
  aadharNumber: row.aadharNumber ?? '',
  corporateId: row.corporateId ?? '',
  vehicleModel: row.vehicleModel ?? '',
  vehicleColor: row.vehicleColor ?? '',
  vehicleType: row.vehicleType ?? '',
  vehicleNumberPlate: row.vehicleNumberPlate ?? '',
  bhaiWayWallet: Number(row.bhaiWayWallet) || 0,
  profilePicture: row.profilePicture ?? '',
  rc: row.rc ?? '',
  corporateIdUrl: row.corporateIdUrl ?? '',
  role: normalizeSheetRole(row.role),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

/**
 * Local UserDetails store (device AsyncStorage).
 * Only stores values the user entered in the app.
 */
export const userDetailsSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    const needsMigrate = rows.some(
      (row) =>
        (row as Partial<UserDetailsSheetRow>).profilePicture === undefined ||
        (row as Partial<UserDetailsSheetRow>).rc === undefined ||
        (row as Partial<UserDetailsSheetRow>).corporateIdUrl === undefined,
    );
    const normalized = rows.map((row) => normalizeStoredRow(row));
    if (needsMigrate) {
      for (const row of normalized) {
        await store.save(row);
      }
    }
    return normalized;
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: UserDetailsSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,

  /** Next UserID: max(existing, 1000) + 1, first profile = 1001. */
  nextUserId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.userId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= USER_DETAILS_USER_ID_START);

    if (ids.length === 0) {
      return USER_DETAILS_USER_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByMobile: (mobile?: string | null): UserDetailsSheetRow | undefined => {
    const key = resolveMobile(mobile);
    if (!key) {
      return undefined;
    }
    return store.getAll().find((row) => normalizeMobile(row.mobile) === key);
  },

  findByUserId: (userId: number): UserDetailsSheetRow | undefined =>
    store.getAll().find((row) => row.userId === userId),

  /** Clear vehicle columns on a row (model, colour, type, plate, RC). */
  clearVehicleFields: async (rowId: number): Promise<UserDetailsSheetRow | null> => {
    await store.hydrate();
    const existing = store.getById(rowId);
    if (!existing) {
      return null;
    }
    return store.save({
      ...existing,
      vehicleModel: '',
      vehicleColor: '',
      vehicleType: '',
      vehicleNumberPlate: '',
      rc: '',
      updated_at: new Date().toISOString(),
    });
  },

  /**
   * Upsert one sheet-shaped row for the current (or given) identity.
   * Match order: userId → mobile → email → aadhaar → user name.
   * New profiles get auto-increment UserID starting at 1001.
   */
  upsertFromApp: async (patch: UserDetailsSheetPatch): Promise<UserDetailsSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      resolveMobile(patch.mobile) ||
      `unknown_${Date.now()}`;

    const existing = findExisting(patch);
    if (existing) {
      const merged = mergeRow(
        existing,
        patch,
        mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
      );
      return store.save({
        ...merged,
        userId: existing.userId > 0 ? existing.userId : userDetailsSheetStore.nextUserId(),
      });
    }

    const userId =
      patch.userId && patch.userId >= USER_DETAILS_USER_ID_START
        ? patch.userId
        : userDetailsSheetStore.nextUserId();

    const base = emptyRow(store.nextId(), mobile, userId);
    return store.save(mergeRow(base, patch, mobile));
  },

  /** Expected header labels (for debugging / UI). */
  headers: USER_DETAILS_SHEET_HEADERS,
};
