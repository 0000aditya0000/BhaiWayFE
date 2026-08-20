import {
  RIDE_BOOKINGS_SHEET_ID_START,
} from '@/DemoData/files';
import { authSession } from '@/store';

import {
  type RideBookingSheetPaymentStatus,
  type RideBookingSheetStatus,
} from '../rideBookingsSheet.types';
import { rideBookingsSheetStore } from '../rideBookingsSheetStore';
import { userDetailsSheetStore } from '../userDetailsSheetStore';

export interface RemoteRideBookingRow {
  bookingId: number;
  rideId: string;
  userId: number;
  mobile: string;
  origin: string;
  destination: string;
  departureLabel: string;
  driverName: string;
  vehicleLabel: string;
  seatsBooked: number;
  amount: number;
  status: string;
  paymentStatus: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  bookedAt: string;
}

export interface RideBookingSyncInput {
  bookingId?: number;
  rideId?: string;
  userId?: number;
  mobile?: string;
  origin: string;
  destination: string;
  departureLabel?: string;
  driverName?: string;
  vehicleLabel?: string;
  seatsBooked?: number;
  amount?: number;
  status?: RideBookingSheetStatus;
  paymentStatus?: RideBookingSheetPaymentStatus;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  bookedAt?: string;
}

export interface RideBookingSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  bookingId: number;
  message: string;
}

const normalizeMobile = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '').slice(-10);

const resolveOwner = () => {
  const phone = normalizeMobile(authSession.getUser()?.phone);
  return (
    (phone ? userDetailsSheetStore.findByMobile(phone) : undefined) ||
    userDetailsSheetStore.getAll()[0]
  );
};

/** Local RideBookings persistence (device store). */
export const rideBookingsSheetSync = {
  /** Hydrate the local RideBookings store. */
  pullIntoLocal: async (): Promise<RemoteRideBookingRow[]> => {
    await rideBookingsSheetStore.hydrate();
    return [];
  },

  upsertAndSync: async (input: RideBookingSyncInput): Promise<RideBookingSyncResult> => {
    if (!input.origin.trim() || !input.destination.trim()) {
      throw Object.assign(new Error('Origin and destination are required.'), {
        code: 'RIDE_BOOKING_VALIDATION_FAILED',
      });
    }

    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';

    const existing =
      input.bookingId && input.bookingId > 0
        ? rideBookingsSheetStore.findByBookingId(input.bookingId)
        : undefined;
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const bookingId =
      existing?.bookingId && existing.bookingId > 0
        ? existing.bookingId
        : input.bookingId && input.bookingId >= RIDE_BOOKINGS_SHEET_ID_START
          ? input.bookingId
          : rideBookingsSheetStore.nextBookingId();

    const saved = await rideBookingsSheetStore.upsert({
      bookingId,
      rideId: input.rideId,
      userId: input.userId || owner?.userId || 0,
      mobile,
      origin: input.origin.trim(),
      destination: input.destination.trim(),
      departureLabel: input.departureLabel,
      driverName: input.driverName,
      vehicleLabel: input.vehicleLabel,
      seatsBooked: input.seatsBooked,
      amount: input.amount,
      status: input.status,
      paymentStatus: input.paymentStatus,
      originLat: input.originLat,
      originLng: input.originLng,
      destLat: input.destLat,
      destLng: input.destLng,
      bookedAt: input.bookedAt,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      bookingId: saved.bookingId,
      message: `BookingID ${saved.bookingId} saved locally.`,
    };
  },
};
