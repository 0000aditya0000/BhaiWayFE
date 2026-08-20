import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  VEHICLES_SHEET_HEADERS,
  VEHICLES_SHEET_VEHICLE_ID_START,
  type VehiclesSheetPatch,
  type VehiclesSheetRow,
} from './vehiclesSheet.types';

const store = createLocalListStore<VehiclesSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.vehiclesSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizePlate = (plate?: string | null): string =>
  (plate ?? '').replace(/\s+/g, ' ').trim().toUpperCase();

const emptyRow = (
  rowId: number,
  vehicleId: number,
  userId: number,
  mobile: string,
): VehiclesSheetRow => ({
  row_id: rowId,
  vehicleId,
  userId,
  mobile,
  vehicleModel: '',
  vehicleColor: '',
  vehicleType: '',
  vehicleNumberPlate: '',
  rc: '',
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<VehiclesSheetRow> & { row_id: number },
): VehiclesSheetRow => ({
  row_id: row.row_id,
  vehicleId: Number(row.vehicleId) || 0,
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  vehicleModel: row.vehicleModel ?? '',
  vehicleColor: row.vehicleColor ?? '',
  vehicleType: row.vehicleType ?? '',
  vehicleNumberPlate: row.vehicleNumberPlate ?? '',
  rc: row.rc ?? '',
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const vehiclesSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: VehiclesSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextVehicleId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.vehicleId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= VEHICLES_SHEET_VEHICLE_ID_START);
    if (ids.length === 0) {
      return VEHICLES_SHEET_VEHICLE_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  getByUserId: (userId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => row.userId === userId),

  getByMobile: (mobile?: string | null) => {
    const key = normalizeMobile(mobile);
    if (!key) {
      return [];
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => normalizeMobile(row.mobile) === key);
  },

  findByPlate: (plate?: string | null, userId?: number): VehiclesSheetRow | undefined => {
    const key = normalizePlate(plate);
    if (!key) {
      return undefined;
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find(
        (row) =>
          normalizePlate(row.vehicleNumberPlate) === key &&
          (userId == null || row.userId === userId),
      );
  },

  /** Current session user's vehicles (mobile → all matching). */
  getForCurrentUser: (): VehiclesSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return vehiclesSheetStore.getByMobile(phone);
  },

  upsert: async (patch: VehiclesSheetPatch): Promise<VehiclesSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;
    const plate = normalizePlate(patch.vehicleNumberPlate);

    const existing =
      (patch.vehicleId && patch.vehicleId > 0
        ? store.getAll().find((row) => row.vehicleId === patch.vehicleId)
        : undefined) ||
      (plate
        ? store.getAll().find(
            (row) =>
              normalizePlate(row.vehicleNumberPlate) === plate &&
              (patch.userId == null || row.userId === patch.userId),
          )
        : undefined);

    if (existing) {
      const merged: VehiclesSheetRow = {
        ...normalizeStoredRow(existing),
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        vehicleModel: patch.vehicleModel?.trim() || existing.vehicleModel,
        vehicleColor: patch.vehicleColor?.trim() || existing.vehicleColor,
        vehicleType: patch.vehicleType?.trim() || existing.vehicleType,
        vehicleNumberPlate: plate || existing.vehicleNumberPlate,
        rc: patch.rc?.trim() || existing.rc,
        vehicleId:
          existing.vehicleId > 0
            ? existing.vehicleId
            : vehiclesSheetStore.nextVehicleId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const vehicleId =
      patch.vehicleId && patch.vehicleId >= VEHICLES_SHEET_VEHICLE_ID_START
        ? patch.vehicleId
        : vehiclesSheetStore.nextVehicleId();

    const base = emptyRow(
      store.nextId(),
      vehicleId,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      vehicleModel: patch.vehicleModel?.trim() || '',
      vehicleColor: patch.vehicleColor?.trim() || '',
      vehicleType: patch.vehicleType?.trim() || '',
      vehicleNumberPlate: plate,
      rc: patch.rc?.trim() || '',
      updated_at: new Date().toISOString(),
    });
  },

  headers: VEHICLES_SHEET_HEADERS,
};
