import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEMO_STORAGE_KEYS,
} from '@/DemoData/files';
import { authSession } from '@/store';

import { userDetailsSheetStore } from '../userDetailsSheetStore';
import {
  VEHICLES_SHEET_VEHICLE_ID_START,
  type VehiclesSheetRow,
} from '../vehiclesSheet.types';
import { vehiclesSheetStore } from '../vehiclesSheetStore';

export interface RemoteVehicleRow {
  vehicleId: number;
  userId: number;
  mobile: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleType: string;
  vehicleNumberPlate: string;
  rc: string;
}

export interface VehicleSyncInput {
  vehicleId?: number;
  userId?: number;
  mobile?: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleType?: string;
  vehicleNumberPlate: string;
  rc?: string;
}

export interface VehicleSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update' | 'delete';
  vehicleId: number;
  message: string;
}

interface DeletedVehicleMark {
  vehicleId: number;
  plate: string;
}

let deletedMarks: DeletedVehicleMark[] = [];
let deletedHydrated = false;

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const normalizePlate = (value?: string | null): string =>
  (value ?? '').replace(/\s+/g, ' ').trim().toUpperCase();

const hydrateDeletedMarks = async (): Promise<DeletedVehicleMark[]> => {
  if (deletedHydrated) {
    return deletedMarks;
  }
  try {
    const raw = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.vehiclesDeleted);
    const parsed = raw ? (JSON.parse(raw) as DeletedVehicleMark[]) : [];
    deletedMarks = Array.isArray(parsed) ? parsed : [];
  } catch {
    deletedMarks = [];
  }
  deletedHydrated = true;
  return deletedMarks;
};

const persistDeletedMarks = async (): Promise<void> => {
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.vehiclesDeleted, JSON.stringify(deletedMarks));
};

const isDeletedMark = (vehicleId: number, plate: string): boolean => {
  const key = normalizePlate(plate);
  return deletedMarks.some(
    (mark) =>
      (vehicleId > 0 && mark.vehicleId === vehicleId) ||
      (key.length > 0 && mark.plate === key),
  );
};

const markVehicleDeleted = async (vehicleId: number, plate: string): Promise<void> => {
  await hydrateDeletedMarks();
  const key = normalizePlate(plate);
  deletedMarks = [
    ...deletedMarks.filter(
      (mark) =>
        !(vehicleId > 0 && mark.vehicleId === vehicleId) &&
        !(key.length > 0 && mark.plate === key),
    ),
    { vehicleId: vehicleId > 0 ? vehicleId : 0, plate: key },
  ];
  await persistDeletedMarks();
};

/**
 * Seed Vehicles store from legacy UserDetails vehicle columns (one car per user).
 */
const migrateLegacyUserDetailsVehicles = async (): Promise<void> => {
  await hydrateDeletedMarks();
  const users = userDetailsSheetStore.getAll();
  for (const user of users) {
    const plate = normalizePlate(user.vehicleNumberPlate);
    const model = user.vehicleModel?.trim();
    if (!plate && !model) {
      continue;
    }
    if (isDeletedMark(0, plate || `LEGACY-${user.userId}`)) {
      continue;
    }
    if (plate && vehiclesSheetStore.findByPlate(plate, user.userId)) {
      continue;
    }
    await vehiclesSheetStore.upsert({
      userId: user.userId,
      mobile: user.mobile,
      vehicleModel: model || 'Vehicle',
      vehicleColor: user.vehicleColor,
      vehicleType: user.vehicleType,
      vehicleNumberPlate: plate || `LEGACY-${user.userId}`,
      rc: user.rc,
    });
  }
};

/** Clear matching legacy UserDetails vehicle columns so migrate cannot resurrect the car. */
const clearLegacyUserDetailsVehicle = async (vehicle: VehiclesSheetRow): Promise<boolean> => {
  const plate = normalizePlate(vehicle.vehicleNumberPlate);
  const owner =
    (vehicle.userId > 0 ? userDetailsSheetStore.findByUserId(vehicle.userId) : undefined) ||
    (vehicle.mobile ? userDetailsSheetStore.findByMobile(vehicle.mobile) : undefined);
  if (!owner) {
    return false;
  }
  const ownerPlate = normalizePlate(owner.vehicleNumberPlate);
  if (!plate || ownerPlate !== plate) {
    return false;
  }

  const cleared = await userDetailsSheetStore.clearVehicleFields(owner.row_id);
  return Boolean(cleared);
};

/** Local Vehicles persistence (device store). */
export const vehiclesSheetSync = {
  /** Hydrate Vehicles store and migrate legacy UserDetails vehicle columns. */
  pullIntoLocal: async (): Promise<RemoteVehicleRow[]> => {
    await vehiclesSheetStore.hydrate();
    await hydrateDeletedMarks();
    await migrateLegacyUserDetailsVehicles();
    return vehiclesSheetStore.getAll().map((row) => ({
      vehicleId: row.vehicleId,
      userId: row.userId,
      mobile: row.mobile,
      vehicleModel: row.vehicleModel,
      vehicleColor: row.vehicleColor,
      vehicleType: row.vehicleType,
      vehicleNumberPlate: row.vehicleNumberPlate,
      rc: row.rc,
    }));
  },

  /**
   * Add or update one vehicle for the current (or given) user.
   * Also marks UserDetails Role as Both (driver + rider) when a vehicle exists.
   */
  upsertAndSync: async (input: VehicleSyncInput): Promise<VehicleSyncResult> => {
    const plate = normalizePlate(input.vehicleNumberPlate);
    const model = input.vehicleModel.trim();
    if (!plate || !model) {
      throw Object.assign(new Error('Vehicle model and number plate are required.'), {
        code: 'VEHICLE_VALIDATION_FAILED',
      });
    }

    const sessionPhone = normalizeMobile(authSession.getUser()?.phone);
    const owner =
      (input.userId && input.userId > 0
        ? userDetailsSheetStore.findByUserId(input.userId)
        : undefined) ||
      (sessionPhone ? userDetailsSheetStore.findByMobile(sessionPhone) : undefined) ||
      userDetailsSheetStore.getAll()[0];
    const resolvedUserId = input.userId || owner?.userId || 0;
    const mobile =
      normalizeMobile(input.mobile) || owner?.mobile || sessionPhone || '';

    const existing =
      (input.vehicleId && input.vehicleId > 0
        ? vehiclesSheetStore.getAll().find((row) => row.vehicleId === input.vehicleId)
        : undefined) || vehiclesSheetStore.findByPlate(plate, resolvedUserId || undefined);

    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const vehicleId =
      existing?.vehicleId && existing.vehicleId > 0
        ? existing.vehicleId
        : input.vehicleId && input.vehicleId >= VEHICLES_SHEET_VEHICLE_ID_START
          ? input.vehicleId
          : vehiclesSheetStore.nextVehicleId();

    // Re-adding a previously deleted plate clears the tombstone.
    await hydrateDeletedMarks();
    deletedMarks = deletedMarks.filter(
      (mark) =>
        !(vehicleId > 0 && mark.vehicleId === vehicleId) && !(plate && mark.plate === plate),
    );
    await persistDeletedMarks();

    const saved = await vehiclesSheetStore.upsert({
      vehicleId,
      userId: resolvedUserId,
      mobile,
      vehicleModel: model,
      vehicleColor: input.vehicleColor,
      vehicleType: input.vehicleType,
      vehicleNumberPlate: plate,
      rc: input.rc,
    });

    // Owning a vehicle ⇒ user can drive and ride.
    if (owner) {
      try {
        const { userDetailsSheetSync } = await import('./userDetailsSheetSync');
        await userDetailsSheetSync.validateAndSync({
          userId: owner.userId,
          userName: owner.userName || 'User',
          email: owner.email,
          mobile: owner.mobile || mobile,
          role: 'Both',
        });
      } catch (error) {
        console.log('[Vehicles] role update skipped', error);
      }
    }

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      vehicleId: saved.vehicleId,
      message: `VehicleID ${saved.vehicleId} saved locally (${mode}).`,
    };
  },

  /** Delete one vehicle from the local Vehicles store. */
  deleteAndSync: async (rowId: number): Promise<VehicleSyncResult> => {
    const existing = vehiclesSheetStore.getById(rowId);
    if (!existing) {
      throw Object.assign(new Error('Vehicle not found.'), { code: 'VEHICLE_NOT_FOUND' });
    }

    await markVehicleDeleted(existing.vehicleId, existing.vehicleNumberPlate);
    await vehiclesSheetStore.removeById(rowId);
    await clearLegacyUserDetailsVehicle(existing);

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode: 'delete',
      vehicleId: existing.vehicleId,
      message: `VehicleID ${existing.vehicleId} removed locally.`,
    };
  },
};
