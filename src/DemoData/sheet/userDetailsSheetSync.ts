import type { UserDetailsSheetRow } from '../userDetailsSheet.types';
import {
  USER_DETAILS_USER_ID_START,
  normalizeSheetRole,
} from '../userDetailsSheet.types';
import { userDetailsSheetStore } from '../userDetailsSheetStore';
import type {
  RemoteUserDetailsRow,
  SheetSyncResult,
  SheetValidationInput,
  SheetValidationResult,
} from './sheet.types';

const normalizeKey = (value?: string | null): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeAadhaar = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-4) || normalizeKey(value);

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

/** Map a local store row to the shared row shape used by validation. */
const localToRemote = (row: UserDetailsSheetRow): RemoteUserDetailsRow => ({
  userId: row.userId,
  userName: row.userName,
  email: row.email,
  aadharNumber: row.aadharNumber,
  corporateId: row.corporateId,
  vehicleModel: row.vehicleModel,
  vehicleColor: row.vehicleColor,
  vehicleType: row.vehicleType,
  vehicleNumberPlate: row.vehicleNumberPlate,
  bhaiWayWallet: row.bhaiWayWallet,
  mobile: row.mobile,
  profilePicture: row.profilePicture,
  rc: row.rc,
  corporateIdUrl: row.corporateIdUrl,
  role: normalizeSheetRole(row.role),
});

const findMatch = (
  rows: RemoteUserDetailsRow[],
  input: SheetValidationInput,
): RemoteUserDetailsRow | undefined => {
  const mobile = normalizeMobile(input.mobile);
  const aadhaar = normalizeAadhaar(input.aadharNumber);
  const name = normalizeKey(input.userName);
  const userId = input.userId;

  return rows.find((row) => {
    if (userId != null && userId > 0 && row.userId === userId) {
      return true;
    }
    const rowMobile = normalizeMobile(row.mobile);
    const rowAadhaar = normalizeAadhaar(row.aadharNumber);
    const rowName = normalizeKey(row.userName);

    if (mobile && rowMobile && mobile === rowMobile) {
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

const resolveNextUserId = (combined: RemoteUserDetailsRow[]): number => {
  const ids = combined
    .map((row) => row.userId)
    .filter((id) => Number.isFinite(id) && id >= USER_DETAILS_USER_ID_START);
  if (ids.length === 0) {
    return USER_DETAILS_USER_ID_START;
  }
  return Math.max(...ids) + 1;
};

const pickMedia = (
  input: string | undefined,
  matched: string | undefined,
  local: string | undefined,
): string => {
  const next = input?.trim();
  if (next) {
    return next;
  }
  return matched?.trim() || local?.trim() || '';
};

/** Local UserDetails persistence (device store). */
export const userDetailsSheetSync = {
  /** Hydrate the local UserDetails store. */
  pullIntoLocal: async (): Promise<RemoteUserDetailsRow[]> => {
    await userDetailsSheetStore.hydrate();
    return userDetailsSheetStore.getAll().map(localToRemote);
  },

  /**
   * Validate profile data against the local store.
   * - insert: no matching row
   * - update: matching row found and no conflicting identity fields
   */
  validate: async (input: SheetValidationInput): Promise<SheetValidationResult> => {
    const errors: string[] = [];
    const userName = input.userName?.trim() ?? '';

    if (userName.length < 2) {
      errors.push('User name is required.');
    }

    const remoteRows: RemoteUserDetailsRow[] = [];
    const combined = userDetailsSheetStore.getAll().map(localToRemote);

    const matched = findMatch(combined, input);
    const aadhaar = normalizeAadhaar(input.aadharNumber);
    const mobile = normalizeMobile(input.mobile);
    const corporate = normalizeKey(input.corporateId);

    if (matched) {
      const matchedAadhaar = normalizeAadhaar(matched.aadharNumber);
      const matchedName = normalizeKey(matched.userName);
      const matchedMobile = normalizeMobile(matched.mobile);

      if (aadhaar && matchedAadhaar && aadhaar === matchedAadhaar && matchedName && matchedName !== normalizeKey(userName)) {
        errors.push('This Aadhaar is already linked to a different user name locally.');
      }
      if (mobile && matchedMobile && mobile === matchedMobile && matchedName && matchedName !== normalizeKey(userName)) {
        errors.push('This mobile is already linked to a different user name locally.');
      }
      if (
        aadhaar &&
        matchedAadhaar &&
        matchedAadhaar !== aadhaar &&
        matchedName === normalizeKey(userName)
      ) {
        errors.push('User name exists locally with a different Aadhaar.');
      }
    }

    if (corporate) {
      const conflict = combined.find(
        (row) =>
          normalizeKey(row.corporateId) === corporate &&
          normalizeKey(row.userName) !== normalizeKey(userName) &&
          (!aadhaar || normalizeAadhaar(row.aadharNumber) !== aadhaar),
      );
      if (conflict) {
        errors.push('Corporate ID is already used by another user locally.');
      }
    }

    if (aadhaar && !matched) {
      const other = combined.find((row) => normalizeAadhaar(row.aadharNumber) === aadhaar);
      if (other && normalizeKey(other.userName) !== normalizeKey(userName)) {
        errors.push('Aadhaar already exists for another user locally.');
      }
    }

    return {
      ok: errors.length === 0,
      mode: matched ? 'update' : 'insert',
      errors,
      matched,
      nextUserId: matched?.userId && matched.userId > 0 ? matched.userId : resolveNextUserId(combined),
      remoteRows,
    };
  },

  /** Validate → save local. */
  validateAndSync: async (input: SheetValidationInput): Promise<SheetSyncResult> => {
    const validation = await userDetailsSheetSync.validate(input);
    if (!validation.ok) {
      throw Object.assign(new Error(validation.errors.join('\n')), {
        code: 'SHEET_VALIDATION_FAILED',
        errors: validation.errors,
      });
    }

    const assignedUserId =
      validation.mode === 'update' && validation.matched?.userId
        ? validation.matched.userId
        : validation.nextUserId ?? userDetailsSheetStore.nextUserId(
            validation.remoteRows.map((row) => row.userId),
          );

    const existingLocal = userDetailsSheetStore.findByUserId(assignedUserId);

    // Keep existing wallet / media unless caller explicitly passes new values.
    const walletAmount =
      input.bhaiWayWallet !== undefined
        ? input.bhaiWayWallet
        : validation.matched?.bhaiWayWallet ?? existingLocal?.bhaiWayWallet ?? 0;

    const saved = await userDetailsSheetStore.upsertFromApp({
      userId: assignedUserId,
      mobile: input.mobile,
      userName: input.userName,
      email: input.email,
      aadharNumber: input.aadharNumber,
      corporateId: input.corporateId,
      vehicleModel: input.vehicleModel,
      vehicleColor: input.vehicleColor,
      vehicleType: input.vehicleType,
      vehicleNumberPlate: input.vehicleNumberPlate,
      bhaiWayWallet: walletAmount,
      profilePicture: pickMedia(
        input.profilePicture,
        validation.matched?.profilePicture,
        existingLocal?.profilePicture,
      ),
      rc: pickMedia(input.rc, validation.matched?.rc, existingLocal?.rc),
      corporateIdUrl: pickMedia(
        input.corporateIdUrl,
        validation.matched?.corporateIdUrl,
        existingLocal?.corporateIdUrl,
      ),
      role: normalizeSheetRole(
        input.role || validation.matched?.role || existingLocal?.role || 'Both',
      ),
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode: validation.mode,
      userId: saved.userId,
      message: `UserID ${saved.userId} saved locally (${validation.mode}).`,
    };
  },

  /** Remove vehicle fields from the current user's local profile row. */
  clearVehicle: async (rowId: number): Promise<SheetSyncResult> => {
    const cleared = await userDetailsSheetStore.clearVehicleFields(rowId);
    if (!cleared) {
      throw Object.assign(new Error('Vehicle not found.'), { code: 'VEHICLE_NOT_FOUND' });
    }

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode: 'update',
      userId: cleared.userId,
      message: `UserID ${cleared.userId} vehicle cleared locally.`,
    };
  },
};
