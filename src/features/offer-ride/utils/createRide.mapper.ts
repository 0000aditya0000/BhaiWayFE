import type { ApiError } from '@/network/network.types';
import { parseSlashDate } from '@/shared/utils/date';
import type { PublishedRideSummary } from '../store/publishedRideStore';
import type { PublishRideDraft, PublishRideVehicleOption } from '../types';
import type { CreateRideDto, RideResponseDto } from '../api/rides.types';
import { CREATE_RIDE_SEAT_LIMITS } from '../api/rides.types';

const FORBIDDEN_CREATE_FIELDS = [
  'driverId',
  'status',
  'availableSeats',
  'assuredDepositPercentage',
  'assuredDepositAmount',
  'regularSeatsPolicy',
  'driverDepositHoldId',
  'womenOnly',
  'genderPreference',
  'music',
] as const;

export const toApiDepartureDate = (slashDate: string): string | null => {
  const parsed = parseSlashDate(slashDate.trim());
  if (!parsed) {
    return null;
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toApiDepartureTime = (label: string): string | null => {
  const trimmed = label.trim();
  const twentyFour = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (twentyFour) {
    return `${twentyFour[1].padStart(2, '0')}:${twentyFour[2]}`;
  }

  const twelveHour = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (!twelveHour) {
    return null;
  }

  let hours = Number(twelveHour[1]);
  const minutes = twelveHour[2];
  const period = twelveHour[3].toUpperCase();
  if (period === 'AM' && hours === 12) {
    hours = 0;
  } else if (period === 'PM' && hours !== 12) {
    hours += 12;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

export const parsePricePerSeat = (value: string): number | null => {
  const amount = Number(String(value).trim());
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return Math.round(amount);
};

/** Client must never send server-controlled or unsupported outcome fields. */
export const assertCreateRidePayload = (payload: CreateRideDto): void => {
  const record = payload as unknown as Record<string, unknown>;
  for (const key of FORBIDDEN_CREATE_FIELDS) {
    if (key in record) {
      throw new Error(`Client must not send ${key} on POST /rides`);
    }
  }
  if (payload.rideType !== 'REGULAR') {
    throw new Error('Regular Ride publish must send rideType REGULAR');
  }
};

type VehicleOptionSource = {
  id: string;
  vehicleType: 'CAR' | 'BIKE';
  make: string;
  model: string;
  color?: string | null;
  registrationNumber: string;
};

export const mapVehicleResponseToPublishOption = (
  row: VehicleOptionSource,
): PublishRideVehicleOption => {
  const plate = (row.registrationNumber ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
  const make = (row.make ?? '').trim();
  const model = (row.model ?? '').trim();
  const color = typeof row.color === 'string' ? row.color.trim() : '';
  const modelLabel = [make, model].filter(Boolean).join(' ');
  const name = modelLabel || model || plate || `Vehicle ${row.id}`;

  return {
    id: row.id,
    name,
    plateNumber: plate || '—',
    icon: row.vehicleType === 'BIKE' ? 'car-sport' : 'car',
  };
};

export type MapCreateRideResult =
  | { ok: true; payload: CreateRideDto }
  | { ok: false; message: string };

export const mapDraftToCreateRideDto = (draft: PublishRideDraft): MapCreateRideResult => {
  const source = draft.origin.trim();
  const destination = draft.destination.trim();
  if (!source) {
    return { ok: false, message: 'Please select a starting point.' };
  }
  if (!destination) {
    return { ok: false, message: 'Please select a destination.' };
  }

  const departureDate = toApiDepartureDate(draft.departureDate);
  if (!departureDate) {
    return { ok: false, message: 'Please select a valid departure date.' };
  }

  const departureTime = toApiDepartureTime(draft.departureTime);
  if (!departureTime) {
    return { ok: false, message: 'Please select a valid departure time.' };
  }

  const totalSeats = draft.availableSeats;
  if (
    !Number.isInteger(totalSeats) ||
    totalSeats < CREATE_RIDE_SEAT_LIMITS.min ||
    totalSeats > CREATE_RIDE_SEAT_LIMITS.max
  ) {
    return {
      ok: false,
      message: `Available seats must be between ${CREATE_RIDE_SEAT_LIMITS.min} and ${CREATE_RIDE_SEAT_LIMITS.max}.`,
    };
  }

  const pricePerSeat = parsePricePerSeat(draft.pricePerSeat);
  if (pricePerSeat === null) {
    return { ok: false, message: 'Please enter a valid price per seat.' };
  }

  const vehicleId = draft.selectedVehicleId?.trim() ?? '';
  if (!vehicleId) {
    return { ok: false, message: 'Please choose a vehicle from My Garage before publishing.' };
  }

  const notes = draft.notes.trim();

  const payload: CreateRideDto = {
    rideType: 'REGULAR',
    vehicleId,
    source,
    destination,
    departureDate,
    departureTime,
    totalSeats,
    pricePerSeat,
    maxTwoInBackSeat: Boolean(draft.maxTwoInBackSeat),
    noSmoking: Boolean(draft.preferences.noSmoking),
    noPets: Boolean(draft.preferences.noPets),
    luggageAllowed: Boolean(draft.preferences.luggage),
    notes: notes.length > 0 ? notes : null,
  };

  // womenOnly and music remain UI-only until the backend DTO supports them.
  assertCreateRidePayload(payload);
  return { ok: true, payload };
};

const formatDisplayDateFromCivil = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const formatDisplayTimeFromCivil = (value: string): string => {
  const hhmm = toApiDepartureTime(value);
  if (!hhmm) {
    return value.trim();
  }
  const [hoursRaw, minutes] = hhmm.split(':');
  const hours = Number(hoursRaw);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${period}`;
};

export const mapRideResponseToPublishedSummary = (
  ride: RideResponseDto,
  vehicle: PublishRideVehicleOption | null,
  extras?: { music?: boolean; notes?: string },
): PublishedRideSummary => {
  const dateLabel = formatDisplayDateFromCivil(ride.departureDate);
  const timeLabel = formatDisplayTimeFromCivil(ride.departureTime);

  return {
    pickupLabel: ride.source,
    dropoffLabel: ride.destination,
    departureLabel: `${dateLabel} · ${timeLabel}`,
    seats: ride.availableSeats,
    pricePerSeat: String(ride.pricePerSeat),
    rideType: ride.rideType === 'ASSURED' ? 'assured' : 'regular',
    vehicle,
    preferences: {
      noSmoking: Boolean(ride.noSmoking),
      noPets: Boolean(ride.noPets),
      luggage: Boolean(ride.luggageAllowed),
      music: Boolean(extras?.music),
    },
    notes: extras?.notes ?? ride.notes ?? '',
    refundableAmount: null,
  };
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
};

const getErrorText = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
};

export const mapCreateRideError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (status === 403) {
    return (
      text.trim() ||
      'You or the selected vehicle is not currently eligible to publish this ride. Complete identity, licence, and vehicle verification, then try again.'
    );
  }

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400) {
    return text.trim() || 'Please check the ride details and try again.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to publish the ride. Check your connection and try again.';
  }

  return text.trim() || 'Unable to publish the ride. Please try again.';
};
