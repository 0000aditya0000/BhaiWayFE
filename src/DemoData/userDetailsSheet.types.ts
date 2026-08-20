/**
 * UserDetails sheet row types.
 * Headers / IDs / roles live in `src/DemoData/files/demoData.common.ts`.
 */

export type {
  UserDetailsSheetHeader,
  UserDetailsSheetRole,
} from './files/demoData.common';

export {
  USER_DETAILS_SHEET_HEADERS,
  USER_DETAILS_SHEET_FIELD_KEYS,
  USER_DETAILS_USER_ID_START,
  userDetailsSheetHeaderCsv,
  normalizeSheetRole,
} from './files/demoData.common';

import type { UserDetailsSheetRole } from './files/demoData.common';

/**
 * Flattened UserDetails local-store row.
 * Note: header "CorporateID" appears twice — index 4 = company/ID text,
 * index 13 = Cloudinary URL of the Corporate ID card image.
 * Vehicles for a user live in the separate Vehicles store (many per user).
 */
export interface UserDetailsSheetRow {
  row_id: number;
  userId: number;
  mobile: string;
  userName: string;
  email: string;
  aadharNumber: string;
  corporateId: string;
  /** @deprecated Prefer Vehicles sheet. */
  vehicleModel: string;
  /** @deprecated Prefer Vehicles sheet. */
  vehicleColor: string;
  /** @deprecated Prefer Vehicles sheet. */
  vehicleType: string;
  /** @deprecated Prefer Vehicles sheet. */
  vehicleNumberPlate: string;
  bhaiWayWallet: number;
  profilePicture: string;
  /** @deprecated Prefer Vehicles sheet RC column. */
  rc: string;
  corporateIdUrl: string;
  role: UserDetailsSheetRole;
  updated_at: string;
}

export type UserDetailsSheetPatch = Partial<
  Omit<UserDetailsSheetRow, 'row_id' | 'updated_at'>
> & {
  mobile?: string;
};
