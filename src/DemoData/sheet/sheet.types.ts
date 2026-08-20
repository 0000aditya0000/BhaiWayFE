import type { UserDetailsSheetRole } from '../userDetailsSheet.types';

/** Local UserDetails row shape used by validation / sync results. */
export interface RemoteUserDetailsRow {
  userId: number;
  userName: string;
  email: string;
  aadharNumber: string;
  corporateId: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleType: string;
  vehicleNumberPlate: string;
  bhaiWayWallet: number;
  mobile: string;
  profilePicture: string;
  rc: string;
  corporateIdUrl: string;
  role: UserDetailsSheetRole;
}

export interface SheetValidationInput {
  userId?: number;
  userName: string;
  email?: string;
  aadharNumber?: string;
  corporateId?: string;
  mobile?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleType?: string;
  vehicleNumberPlate?: string;
  bhaiWayWallet?: number;
  profilePicture?: string;
  rc?: string;
  corporateIdUrl?: string;
  role?: UserDetailsSheetRole | string;
}

export interface SheetValidationResult {
  ok: boolean;
  mode: 'insert' | 'update';
  errors: string[];
  matched?: RemoteUserDetailsRow;
  /** Suggested UserID for insert (1001+). */
  nextUserId?: number;
  remoteRows: RemoteUserDetailsRow[];
}

export interface SheetSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  userId: number;
  message: string;
}
