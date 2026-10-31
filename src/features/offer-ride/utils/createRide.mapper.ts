import type { ApiError } from '@/network/network.types';
import { parseSlashDate } from '@/shared/utils/date';
import type { PublishedRideSummary } from '../store/publishedRideStore';
import type { PublishRideDraft, PublishRideVehicleOption } from '../types';
import type { CreateRideDto, RideResponseDto } from '../api/rides.types';
import { CREATE_RIDE_SEAT_LIMITS } from '../api/rides.types';
import { mapRideStatusLabel } from './mapRideStatusLabel';
import { PUBLISH_REQUIREMENT_MESSAGES } from './publishReadiness';
import {
  ROUTE_SELECTION_USER_MESSAGES,
  isRouteSelectionTokenError,
  mapRouteSelectionError,
  selectionMatchesEndpoints,
  toRouteEndpoints,
} from './routeSelection';

const FORBIDDEN_CREATE_FIELDS = [
  'driverId',
  'status',
  'availableSeats',
  'assuredDepositPercentage',
  'assuredDepositAmount',
  'regularSeatsPolicy',
  'driverDepositHoldId',
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

/**
 * Normalize WGS84 coords for POST /rides.
 * Backend `@IsNumber({ maxDecimalPlaces: 6 })` rejects raw GPS float noise.
 */
export const toApiCoordinate = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(numeric * 1e6) / 1e6;
};

export const isValidApiCoordinatePair = (
  latitude: unknown,
  longitude: unknown,
): boolean => {
  const lat = toApiCoordinate(latitude);
  const lng = toApiCoordinate(longitude);
  if (lat == null || lng == null) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

/** Client must never send server-controlled or unsupported outcome fields. */
export const assertCreateRidePayload = (payload: CreateRideDto): void => {
  const record = payload as unknown as Record<string, unknown>;
  for (const key of FORBIDDEN_CREATE_FIELDS) {
    if (key in record) {
      throw new Error(`Client must not send ${key} on POST /rides`);
    }
  }
  if (payload.rideType !== 'REGULAR' && payload.rideType !== 'ASSURED') {
    throw new Error('POST /rides must send rideType REGULAR or ASSURED');
  }
  if (!payload.routeSelectionToken?.trim()) {
    throw new Error('POST /rides must send routeSelectionToken');
  }
  const coords = [
    payload.sourceLatitude,
    payload.sourceLongitude,
    payload.destinationLatitude,
    payload.destinationLongitude,
  ];
  const allValid = coords.every(
    (value) => typeof value === 'number' && Number.isFinite(value),
  );
  if (
    !allValid ||
    !isValidApiCoordinatePair(coords[0], coords[1]) ||
    !isValidApiCoordinatePair(coords[2], coords[3])
  ) {
    throw new Error('POST /rides must send valid source/destination coordinates');
  }
};

type VehicleOptionSource = {
  id: string;
  vehicleType: 'CAR' | 'BIKE';
  make: string;
  model: string;
  color?: string | null;
  registrationNumber: string;
  isActive?: boolean;
  isRcVerified?: boolean | null;
  isVerified?: boolean | null;
  rcVerificationStatus?: string | null;
};

export const mapVehicleResponseToPublishOption = (
  row: VehicleOptionSource,
): PublishRideVehicleOption => {
  const plate = (row.registrationNumber ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
  const make = (row.make ?? '').trim();
  const model = (row.model ?? '').trim();
  const color = typeof row.color === 'string' ? row.color.trim() : '';
  const modelLabel =
    make && model && make.toLowerCase() === model.toLowerCase()
      ? model
      : [make, model].filter(Boolean).join(' ');
  const name = modelLabel || model || plate || `Vehicle ${row.id}`;
  const isRcVerified =
    row.isRcVerified === true ||
    row.isVerified === true ||
    String(row.rcVerificationStatus ?? '')
      .trim()
      .toUpperCase() === 'VERIFIED';

  return {
    id: row.id,
    name,
    plateNumber: plate || '—',
    icon: row.vehicleType === 'BIKE' ? 'car-sport' : 'car',
    isActive: row.isActive !== false,
    isRcVerified,
  };
};

export type MapCreateRideResult =
  | { ok: true; payload: CreateRideDto }
  | { ok: false; message: string };

/** UX copy aligned with backend codes — backend remains authoritative. */
export const CREATE_RIDE_USER_MESSAGES = {
  departureInPast: 'Ride departure time must be in the future.',
  activeAssuredExists:
    'You already have an active Assured Ride. Complete or cancel it before publishing another Assured Ride.',
} as const;

/**
 * Soft client check only (local clock). Backend `RIDE_DEPARTURE_IN_PAST` is authoritative.
 */
export const isLocalDepartureInPast = (
  slashDate: string,
  timeLabel: string,
  now: Date = new Date(),
): boolean => {
  const date = parseSlashDate(slashDate.trim());
  const hhmm = toApiDepartureTime(timeLabel);
  if (!date || !hhmm) {
    return false;
  }
  const [hoursRaw, minutesRaw] = hhmm.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return false;
  }
  const departure = new Date(date);
  departure.setHours(hours, minutes, 0, 0);
  return departure.getTime() <= now.getTime();
};

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

  if (isLocalDepartureInPast(draft.departureDate, draft.departureTime)) {
    return { ok: false, message: CREATE_RIDE_USER_MESSAGES.departureInPast };
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
  const apiRideType = draft.rideType === 'assured' ? 'ASSURED' : 'REGULAR';

  const origin = draft.originLocation;
  const dropoff = draft.destinationLocation;
  const endpoints = toRouteEndpoints(
    origin?.latitude,
    origin?.longitude,
    dropoff?.latitude,
    dropoff?.longitude,
  );
  if (!endpoints) {
    return {
      ok: false,
      message: ROUTE_SELECTION_USER_MESSAGES.missingCoords,
    };
  }

  const selection = draft.routeSelection;
  if (!selection?.selectionToken?.trim()) {
    return { ok: false, message: ROUTE_SELECTION_USER_MESSAGES.required };
  }
  if (!selectionMatchesEndpoints(selection, endpoints)) {
    return { ok: false, message: ROUTE_SELECTION_USER_MESSAGES.stale };
  }

  const payload: CreateRideDto = {
    rideType: apiRideType,
    vehicleId,
    source,
    destination,
    routeSelectionToken: selection.selectionToken,
    sourceLatitude: endpoints.sourceLatitude,
    sourceLongitude: endpoints.sourceLongitude,
    destinationLatitude: endpoints.destinationLatitude,
    destinationLongitude: endpoints.destinationLongitude,
    departureDate,
    departureTime,
    totalSeats,
    pricePerSeat,
    maxTwoInBackSeat: Boolean(draft.maxTwoInBackSeat),
    noSmoking: Boolean(draft.preferences.noSmoking),
    noPets: Boolean(draft.preferences.noPets),
    luggageAllowed: Boolean(draft.preferences.luggage),
    womenOnly: Boolean(draft.womenOnly),
    notes: notes.length > 0 ? notes : null,
  };

  // music remains UI-only until the backend DTO supports it.
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
    rideId: ride.id,
    backendStatus: ride.status,
    isBookable: ride.isBookable,
    statusLabel: mapRideStatusLabel(ride.status, ride.rideType),
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
    refundableAmount:
      ride.assuredDepositAmount != null && String(ride.assuredDepositAmount).trim()
        ? String(ride.assuredDepositAmount).trim()
        : null,
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

const getErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as ApiError).code;
    if (typeof code === 'string') {
      return code.trim().toUpperCase();
    }
  }
  return '';
};

export const mapCreateRideError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const text = getErrorText(error);
  const normalized = `${code} ${text}`.toUpperCase();

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (
    code === 'RIDE_DEPARTURE_IN_PAST' ||
    normalized.includes('RIDE_DEPARTURE_IN_PAST')
  ) {
    return CREATE_RIDE_USER_MESSAGES.departureInPast;
  }

  if (
    code === 'ACTIVE_ASSURED_RIDE_EXISTS' ||
    normalized.includes('ACTIVE_ASSURED_RIDE_EXISTS')
  ) {
    return CREATE_RIDE_USER_MESSAGES.activeAssuredExists;
  }

  if (
    normalized.includes('AADHAAR') ||
    normalized.includes('IDENTITY') ||
    code === 'IDENTITY_NOT_VERIFIED' ||
    code === 'AADHAAR_NOT_VERIFIED'
  ) {
    return 'Aadhaar verification is required before publishing a ride.';
  }

  if (
    normalized.includes('VEHICLE_RC') ||
    normalized.includes('RC_NOT') ||
    code === 'VEHICLE_RC_NOT_VERIFIED' ||
    (normalized.includes('VEHICLE') &&
      normalized.includes('VERIF') &&
      !normalized.includes('LICEN'))
  ) {
    return 'Vehicle RC verification is required before publishing a ride.';
  }

  if (status === 403) {
    // Do not claim Driving License is required — DL is optional.
    return text.trim() || PUBLISH_REQUIREMENT_MESSAGES.generic;
  }

  if (isRouteSelectionTokenError(error)) {
    return mapRouteSelectionError(error);
  }

  if (status === 400) {
    return text.trim() || 'Please check the ride details and try again.';
  }

  if (
    code === 'IDEMPOTENCY_KEY_CONFLICT' ||
    normalized.includes('IDEMPOTENCY') && normalized.includes('PAYLOAD')
  ) {
    return (
      text.trim() ||
      'This publish attempt does not match the previous request. Change the schedule and try again, or wait and retry the same details.'
    );
  }

  if (status === 409) {
    return text.trim() || 'This ride was already published or conflicts with a previous attempt.';
  }

  if (status === 422) {
    return (
      text.trim() ||
      'Insufficient BhaiWay Coins for the Assured driver deposit. Add coins and try again.'
    );
  }

  if (status === 0) {
    return text.trim() || 'Unable to publish the ride. Check your connection and try again.';
  }

  return text.trim() || 'Unable to publish the ride. Please try again.';
};

/** Docs: POST /rides/:id/cancel — owning driver only. */
export const mapCancelRideError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const text = getErrorText(error);
  const normalized = text.trim().toLowerCase();
  const normalizedCode = `${code} ${text}`.toUpperCase();

  if (
    code === 'COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS' ||
    normalizedCode.includes('COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS')
  ) {
    return 'This trip is already in progress, so it cannot be cancelled as a series from this occurrence. Finish the trip, or cancel a later occurrence instead.';
  }

  // Backend currently rejects Regular rides on POST /rides/:id/cancel with this message.
  // Mobile is calling the documented driver-cancel endpoint; this is a server lifecycle bug.
  // Note: backend has misspelled "lifecyle" in some responses.
  if (
    normalized.includes('assured lifecycle') ||
    normalized.includes('assured lifecyle') ||
    normalized.includes('only to assured')
  ) {
    return (
      'This Regular ride could not be cancelled. The server treated cancel as an Assured-only action. Please update the backend so POST /rides/:id/cancel supports Regular rides.'
    );
  }

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 403) {
    return text.trim() || 'You can only cancel rides that you own.';
  }

  if (status === 404) {
    return text.trim() || 'This ride was not found or is no longer available.';
  }

  if (status === 400 || status === 409 || status === 422) {
    return text.trim() || 'Unable to cancel this ride right now.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to cancel. Check your connection and try again.';
  }

  return text.trim() || 'Unable to cancel this ride. Please try again.';
};

export const isRideCancelAlreadyApplied = (
  result: { status?: string; alreadyApplied?: boolean } | null | undefined,
): boolean => {
  if (!result) {
    return false;
  }
  if (result.alreadyApplied === true) {
    return true;
  }
  return String(result.status ?? '').trim().toUpperCase() === 'CANCELLED';
};
