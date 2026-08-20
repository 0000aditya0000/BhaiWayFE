import { DEMO_STORAGE_KEYS } from '@/DemoData/files';
import { authSession } from '@/store';

import { createLocalListStore } from './localStore';
import {
  RIDE_BOOKINGS_SHEET_HEADERS,
  RIDE_BOOKINGS_SHEET_ID_START,
  type RideBookingSheetPaymentStatus,
  type RideBookingSheetStatus,
  type RideBookingsSheetPatch,
  type RideBookingsSheetRow,
} from './rideBookingsSheet.types';

const store = createLocalListStore<RideBookingsSheetRow, 'row_id'>(
  DEMO_STORAGE_KEYS.rideBookingsSheet,
  'row_id',
);

const normalizeMobile = (mobile?: string | null): string =>
  (mobile ?? '').replace(/\D/g, '').slice(-10);

const normalizeStatus = (value?: string | null): RideBookingSheetStatus => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'cancelled' || key === 'completed') {
    return key;
  }
  return 'confirmed';
};

const normalizePaymentStatus = (value?: string | null): RideBookingSheetPaymentStatus =>
  (value ?? '').trim().toLowerCase() === 'pending' ? 'pending' : 'paid';

const parseCoord = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const emptyRow = (
  rowId: number,
  bookingId: number,
  userId: number,
  mobile: string,
): RideBookingsSheetRow => ({
  row_id: rowId,
  bookingId,
  rideId: '',
  userId,
  mobile,
  origin: '',
  destination: '',
  departureLabel: '',
  driverName: '',
  vehicleLabel: '',
  seatsBooked: 0,
  amount: 0,
  status: 'confirmed',
  paymentStatus: 'pending',
  originLat: 0,
  originLng: 0,
  destLat: 0,
  destLng: 0,
  bookedAt: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeStoredRow = (
  row: Partial<RideBookingsSheetRow> & { row_id: number },
): RideBookingsSheetRow => ({
  row_id: row.row_id,
  bookingId: Number(row.bookingId) || 0,
  rideId: row.rideId != null ? String(row.rideId) : '',
  userId: Number(row.userId) || 0,
  mobile: row.mobile ?? '',
  origin: row.origin ?? '',
  destination: row.destination ?? '',
  departureLabel: row.departureLabel ?? '',
  driverName: row.driverName ?? '',
  vehicleLabel: row.vehicleLabel ?? '',
  seatsBooked: Number(row.seatsBooked) || 0,
  amount: Number(row.amount) || 0,
  status: normalizeStatus(row.status),
  paymentStatus: normalizePaymentStatus(row.paymentStatus),
  originLat: parseCoord(row.originLat),
  originLng: parseCoord(row.originLng),
  destLat: parseCoord(row.destLat),
  destLng: parseCoord(row.destLng),
  bookedAt: row.bookedAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? new Date().toISOString(),
});

export const rideBookingsSheetStore = {
  hydrate: async () => {
    const rows = await store.hydrate();
    return rows.map((row) => normalizeStoredRow(row));
  },
  getAll: () => store.getAll().map((row) => normalizeStoredRow(row)),
  subscribe: (listener: (items: RideBookingsSheetRow[]) => void) =>
    store.subscribe((items) => listener(items.map((row) => normalizeStoredRow(row)))),
  clear: store.clear,
  removeById: store.removeById,
  getById: (rowId: number) => {
    const row = store.getById(rowId);
    return row ? normalizeStoredRow(row) : undefined;
  },

  nextBookingId: (extraIds: number[] = []): number => {
    const ids = [
      ...store.getAll().map((row) => row.bookingId),
      ...extraIds,
    ].filter((id) => Number.isFinite(id) && id >= RIDE_BOOKINGS_SHEET_ID_START);
    if (ids.length === 0) {
      return RIDE_BOOKINGS_SHEET_ID_START;
    }
    return Math.max(...ids) + 1;
  },

  findByBookingId: (bookingId: number) =>
    store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .find((row) => row.bookingId === bookingId),

  getByMobile: (mobile?: string | null) => {
    const key = normalizeMobile(mobile);
    if (!key) {
      return [];
    }
    return store
      .getAll()
      .map((row) => normalizeStoredRow(row))
      .filter((row) => normalizeMobile(row.mobile) === key)
      .sort((a, b) => b.bookingId - a.bookingId);
  },

  getForCurrentUser: (): RideBookingsSheetRow[] => {
    const phone = authSession.getUser()?.phone;
    return rideBookingsSheetStore.getByMobile(phone);
  },

  upsert: async (patch: RideBookingsSheetPatch): Promise<RideBookingsSheetRow> => {
    await store.hydrate();
    const mobile =
      normalizeMobile(patch.mobile) ||
      normalizeMobile(authSession.getUser()?.phone) ||
      `unknown_${Date.now()}`;

    const existing =
      (patch.bookingId && patch.bookingId > 0
        ? store.getAll().find((row) => row.bookingId === patch.bookingId)
        : undefined) ||
      (patch.row_id ? store.getById(patch.row_id) : undefined);

    if (existing) {
      const merged: RideBookingsSheetRow = {
        ...normalizeStoredRow(existing),
        userId: patch.userId && patch.userId > 0 ? patch.userId : existing.userId,
        mobile: mobile.startsWith('unknown_') ? existing.mobile || mobile : mobile,
        rideId: patch.rideId !== undefined ? String(patch.rideId) : existing.rideId,
        origin: patch.origin?.trim() || existing.origin,
        destination: patch.destination?.trim() || existing.destination,
        departureLabel: patch.departureLabel?.trim() || existing.departureLabel,
        driverName: patch.driverName?.trim() || existing.driverName,
        vehicleLabel: patch.vehicleLabel?.trim() || existing.vehicleLabel,
        seatsBooked:
          patch.seatsBooked !== undefined
            ? Number(patch.seatsBooked) || 0
            : existing.seatsBooked,
        amount: patch.amount !== undefined ? Number(patch.amount) || 0 : existing.amount,
        status: patch.status ? normalizeStatus(patch.status) : existing.status,
        paymentStatus: patch.paymentStatus
          ? normalizePaymentStatus(patch.paymentStatus)
          : existing.paymentStatus,
        originLat:
          patch.originLat !== undefined ? parseCoord(patch.originLat) : existing.originLat,
        originLng:
          patch.originLng !== undefined ? parseCoord(patch.originLng) : existing.originLng,
        destLat: patch.destLat !== undefined ? parseCoord(patch.destLat) : existing.destLat,
        destLng: patch.destLng !== undefined ? parseCoord(patch.destLng) : existing.destLng,
        bookedAt: existing.bookedAt || new Date().toISOString(),
        bookingId:
          existing.bookingId > 0
            ? existing.bookingId
            : rideBookingsSheetStore.nextBookingId(),
        updated_at: new Date().toISOString(),
      };
      return store.save(merged);
    }

    const bookingId =
      patch.bookingId && patch.bookingId >= RIDE_BOOKINGS_SHEET_ID_START
        ? patch.bookingId
        : rideBookingsSheetStore.nextBookingId();

    const base = emptyRow(
      store.nextId(),
      bookingId,
      patch.userId && patch.userId > 0 ? patch.userId : 0,
      mobile,
    );

    return store.save({
      ...base,
      rideId: patch.rideId != null ? String(patch.rideId) : '',
      origin: patch.origin?.trim() || '',
      destination: patch.destination?.trim() || '',
      departureLabel: patch.departureLabel?.trim() || '',
      driverName: patch.driverName?.trim() || '',
      vehicleLabel: patch.vehicleLabel?.trim() || '',
      seatsBooked: Number(patch.seatsBooked) || 0,
      amount: Number(patch.amount) || 0,
      status: normalizeStatus(patch.status),
      paymentStatus: normalizePaymentStatus(patch.paymentStatus),
      originLat: parseCoord(patch.originLat),
      originLng: parseCoord(patch.originLng),
      destLat: parseCoord(patch.destLat),
      destLng: parseCoord(patch.destLng),
      bookedAt: patch.bookedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  headers: RIDE_BOOKINGS_SHEET_HEADERS,
};
