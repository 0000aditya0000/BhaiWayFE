import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  PUBLISHED_RIDES_SHEET_HEADERS,
  PUBLISHED_RIDES_SHEET_ID_START,
  type PublishedRideSheetStatus,
  type PublishedRideSheetType,
  type PublishedRidesSheetPatch,
  type PublishedRidesSheetRow,
} from './publishedRidesSheet.types';

const store = createLocalListStore<PublishedRidesSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.publishedRidesSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeRideType = (value?: string | null): PublishedRideSheetType =>
  (value ?? '').trim().toLowerCase() === 'assured' ? 'assured' : 'regular';

const normalizeStatus = (value?: string | null): PublishedRideSheetStatus => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'cancelled' || key === 'completed') {
    return key;
  }
  return 'published';
};

const parseBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const key = String(value ?? '')
    .trim()
    .toLowerCase();
  return key === 'true' || key === '1' || key === 'yes' || key === 'y';
};

const parseCoord = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const emptyRow = (
  rowId: number,
  rideId: number,
  userId: number,
  mobile: string,
): PublishedRidesSheetRow => ({
  row_id: rowId,
  rideId,
  userId,
  mobile,
  rideType: 'regular',
  origin: '',
  destination: '',
  departureDate: '',
  departureTime: '',
  availableSeats: 0,
  pricePerSeat: '',
  preferences: '',
  notes: '',
  vehicleName: '',
  vehiclePlate: '',
  maxTwoInBack: false,
  womenOnly: false,
  originLat: 0,
  originLng: 0,
  destLat: 0,
  destLng: 0,
  status: 'published',
  publishedAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<PublishedRidesSheetRow> & { row_id: number },
): PublishedRidesSheetRow => ({
  row_id: row.row_id,
  rideId: Number(row.rideId) || 0,
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  rideType: normalizeRideType(row.rideType),
  origin: row.origin ?? '',
  destination: row.destination ?? '',
  departureDate: row.departureDate ?? '',
  departureTime: row.departureTime ?? '',
  availableSeats: Number(row.availableSeats) || 0,
  pricePerSeat: row.pricePerSeat != null ? String(row.pricePerSeat) : '',
  preferences: row.preferences ?? '',
  notes: row.notes ?? '',
  vehicleName: row.vehicleName ?? '',
  vehiclePlate: row.vehiclePlate ?? '',
  maxTwoInBack: parseBool(row.maxTwoInBack),
  womenOnly: parseBool(row.womenOnly),
  originLat: parseCoord(row.originLat),
  originLng: parseCoord(row.originLng),
  destLat: parseCoord(row.destLat),
  destLng: parseCoord(row.destLng),
  status: normalizeStatus(row.status),
  publishedAt: row.publishedAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const publishedRidesSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: PublishedRidesSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextRideId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.rideId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= PUBLISHED_RIDES_SHEET_ID_START);
    if (ids.length === 0) {
      return PUBLISHED_RIDES_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByRideId: (rideId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find((row) => row.rideId === rideId),

  getByMobile: (mobile?: string | null) => {
    const key = normalizeMobile(mobile);
    if (!key) {
      return [];
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => normalizeMobile(row.mobile) === key)
      .sort((a, b) => b.rideId - a.rideId);
  },

  getForCurrentUser: (): PublishedRidesSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return publishedRidesSheetStore.getByMobile(phone);
  },

  upsert: async (patch: PublishedRidesSheetPatch): Promise<PublishedRidesSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;

    const existing =
      (patch.rideId && patch.rideId > 0
        ? store.getAll().find((row) => row.rideId === patch.rideId)
        : undefined) ||
      (patch.row_id ? store.getById(patch.row_id) : undefined);

    if (existing) {
      const merged: PublishedRidesSheetRow = {
        ...normalizeStoredRow(existing),
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        rideType: patch.rideType ? normalizeRideType(patch.rideType) : existing.rideType,
        origin: patch.origin?.trim() || existing.origin,
        destination: patch.destination?.trim() || existing.destination,
        departureDate: patch.departureDate?.trim() || existing.departureDate,
        departureTime: patch.departureTime?.trim() || existing.departureTime,
        availableSeats:
          patch.availableSeats !== undefined
            ? Number(patch.availableSeats) || 0
            : existing.availableSeats,
        pricePerSeat:
          patch.pricePerSeat !== undefined
            ? String(patch.pricePerSeat)
            : existing.pricePerSeat,
        preferences:
          patch.preferences !== undefined ? String(patch.preferences) : existing.preferences,
        notes: patch.notes !== undefined ? String(patch.notes) : existing.notes,
        vehicleName: patch.vehicleName?.trim() || existing.vehicleName,
        vehiclePlate: patch.vehiclePlate?.trim() || existing.vehiclePlate,
        maxTwoInBack:
          patch.maxTwoInBack !== undefined
            ? parseBool(patch.maxTwoInBack)
            : existing.maxTwoInBack,
        womenOnly:
          patch.womenOnly !== undefined ? parseBool(patch.womenOnly) : existing.womenOnly,
        originLat:
          patch.originLat !== undefined ? parseCoord(patch.originLat) : existing.originLat,
        originLng:
          patch.originLng !== undefined ? parseCoord(patch.originLng) : existing.originLng,
        destLat: patch.destLat !== undefined ? parseCoord(patch.destLat) : existing.destLat,
        destLng: patch.destLng !== undefined ? parseCoord(patch.destLng) : existing.destLng,
        status: patch.status ? normalizeStatus(patch.status) : existing.status,
        publishedAt: existing.publishedAt || new Date().toISOString(),
        rideId:
          existing.rideId > 0 ? existing.rideId : publishedRidesSheetStore.nextRideId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const rideId =
      patch.rideId && patch.rideId >= PUBLISHED_RIDES_SHEET_ID_START
        ? patch.rideId
        : publishedRidesSheetStore.nextRideId();

    const base = emptyRow(
      store.nextId(),
      rideId,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      rideType: normalizeRideType(patch.rideType),
      origin: patch.origin?.trim() || '',
      destination: patch.destination?.trim() || '',
      departureDate: patch.departureDate?.trim() || '',
      departureTime: patch.departureTime?.trim() || '',
      availableSeats: Number(patch.availableSeats) || 0,
      pricePerSeat: patch.pricePerSeat != null ? String(patch.pricePerSeat) : '',
      preferences: patch.preferences != null ? String(patch.preferences) : '',
      notes: patch.notes != null ? String(patch.notes) : '',
      vehicleName: patch.vehicleName?.trim() || '',
      vehiclePlate: patch.vehiclePlate?.trim() || '',
      maxTwoInBack: parseBool(patch.maxTwoInBack),
      womenOnly: parseBool(patch.womenOnly),
      originLat: parseCoord(patch.originLat),
      originLng: parseCoord(patch.originLng),
      destLat: parseCoord(patch.destLat),
      destLng: parseCoord(patch.destLng),
      status: normalizeStatus(patch.status),
      publishedAt: patch.publishedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  headers: PUBLISHED_RIDES_SHEET_HEADERS,
};
