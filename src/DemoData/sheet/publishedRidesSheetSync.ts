import {
  PUBLISHED_RIDES_SHEET_ID_START,
} from '@/DemoData/files';
import { authSession } from '@/store';

import {
  type PublishedRideSheetStatus,
  type PublishedRideSheetType,
} from '../publishedRidesSheet.types';
import { publishedRidesSheetStore } from '../publishedRidesSheetStore';
import { userDetailsSheetStore } from '../userDetailsSheetStore';

export interface RemotePublishedRideRow {
  rideId: number;
  userId: number;
  mobile: string;
  rideType: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: string;
  preferences: string;
  notes: string;
  vehicleName: string;
  vehiclePlate: string;
  maxTwoInBack: boolean;
  womenOnly: boolean;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  status: string;
  publishedAt: string;
}

export interface PublishedRideSyncInput {
  rideId?: number;
  userId?: number;
  mobile?: string;
  rideType?: PublishedRideSheetType;
  origin: string;
  destination: string;
  departureDate?: string;
  departureTime?: string;
  availableSeats?: number;
  pricePerSeat?: string;
  preferences?: string;
  notes?: string;
  vehicleName?: string;
  vehiclePlate?: string;
  maxTwoInBack?: boolean;
  womenOnly?: boolean;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  status?: PublishedRideSheetStatus;
  publishedAt?: string;
}

export interface PublishedRideSyncResult {
  localRowSaved: boolean;
  remoteSynced: boolean;
  mode: 'insert' | 'update';
  rideId: number;
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

/** Local PublishedRides persistence (device store). */
export const publishedRidesSheetSync = {
  /** Hydrate the local PublishedRides store. */
  pullIntoLocal: async (): Promise<RemotePublishedRideRow[]> => {
    await publishedRidesSheetStore.hydrate();
    return [];
  },

  upsertAndSync: async (input: PublishedRideSyncInput): Promise<PublishedRideSyncResult> => {
    if (!input.origin.trim() || !input.destination.trim()) {
      throw Object.assign(new Error('Origin and destination are required.'), {
        code: 'PUBLISHED_RIDE_VALIDATION_FAILED',
      });
    }

    const owner = resolveOwner();
    const mobile =
      normalizeMobile(input.mobile) ||
      owner?.mobile ||
      normalizeMobile(authSession.getUser()?.phone) ||
      '';

    const existing =
      input.rideId && input.rideId > 0
        ? publishedRidesSheetStore.findByRideId(input.rideId)
        : undefined;
    const mode: 'insert' | 'update' = existing ? 'update' : 'insert';
    const rideId =
      existing?.rideId && existing.rideId > 0
        ? existing.rideId
        : input.rideId && input.rideId >= PUBLISHED_RIDES_SHEET_ID_START
          ? input.rideId
          : publishedRidesSheetStore.nextRideId();

    const saved = await publishedRidesSheetStore.upsert({
      rideId,
      userId: input.userId || owner?.userId || 0,
      mobile,
      rideType: input.rideType,
      origin: input.origin.trim(),
      destination: input.destination.trim(),
      departureDate: input.departureDate,
      departureTime: input.departureTime,
      availableSeats: input.availableSeats,
      pricePerSeat: input.pricePerSeat,
      preferences: input.preferences,
      notes: input.notes,
      vehicleName: input.vehicleName,
      vehiclePlate: input.vehiclePlate,
      maxTwoInBack: input.maxTwoInBack,
      womenOnly: input.womenOnly,
      originLat: input.originLat,
      originLng: input.originLng,
      destLat: input.destLat,
      destLng: input.destLng,
      status: input.status,
      publishedAt: input.publishedAt,
    });

    return {
      localRowSaved: true,
      remoteSynced: false,
      mode,
      rideId: saved.rideId,
      message: `RideID ${saved.rideId} saved locally.`,
    };
  },
};
