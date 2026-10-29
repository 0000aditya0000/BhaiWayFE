import type { ApiError } from '@/network/network.types';

import type { ModifyRideFormState } from '../../my-rides/constants/modify-ride.constants';
import { sumActiveBookedSeats } from '../../my-rides/utils/mapDriverBooking';
import type { BookingResponseDto } from '../../ride-search/api/bookings.types';

import {
  CREATE_RIDE_SEAT_LIMITS,
  type ApiSeriesScope,
  type RideResponseDto,
  type UpdateRideDto,
} from '../api/rides.types';
import { parsePricePerSeat, toApiDepartureDate, toApiDepartureTime } from './createRide.mapper';
import {
  ROUTE_SELECTION_USER_MESSAGES,
  isRouteSelectionTokenError,
  mapRouteSelectionError,
  selectionMatchesEndpoints,
  toRouteEndpoints,
} from './routeSelection';
import { resolveWomenOnly } from '@/shared/utils/womenOnlyRide';

const FORBIDDEN_UPDATE_FIELDS = [
  'driverId',
  'status',
  'availableSeats',
  'bookedSeats',
  'rideType',
] as const;

export const toSlashDateFromApi = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

export const toDisplayTimeFromApi = (value: string): string => {
  const hhmm = toApiDepartureTime(value);
  if (!hhmm) {
    return value.trim();
  }
  const [hoursRaw, minutes] = hhmm.split(':');
  const hours = Number(hoursRaw);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${period}`;
};

export const resolveBookedSeats = (
  ride: RideResponseDto,
  bookings: readonly BookingResponseDto[],
): number => {
  const fromRide = Math.max(0, ride.totalSeats - ride.availableSeats);
  const fromBookings = sumActiveBookedSeats(bookings);
  return Math.max(fromRide, fromBookings);
};

export const isRideModifiable = (status: string | undefined): boolean =>
  String(status ?? '').trim().toUpperCase() === 'PUBLISHED';

export const computeSeatBounds = (
  bookedSeats: number,
): { min: number; max: number } => {
  const booked = Math.max(0, Math.floor(bookedSeats));
  const min = booked > 0 ? booked : CREATE_RIDE_SEAT_LIMITS.min;
  const max = Math.max(min, CREATE_RIDE_SEAT_LIMITS.max);
  return { min, max };
};

export const didModifyRouteChange = (form: ModifyRideFormState): boolean =>
  form.origin.trim() !== form.originalOrigin.trim() ||
  form.destination.trim() !== form.originalDestination.trim();

export const mapRideToModifyForm = (
  ride: RideResponseDto,
  fallback: ModifyRideFormState,
): ModifyRideFormState => ({
  ...fallback,
  rideId: ride.id,
  origin: ride.source,
  destination: ride.destination,
  originalOrigin: ride.source,
  originalDestination: ride.destination,
  departureDate: toSlashDateFromApi(ride.departureDate),
  departureTime: toDisplayTimeFromApi(ride.departureTime),
  availableSeats: ride.totalSeats,
  pricePerSeat: String(ride.pricePerSeat),
  maxTwoInBackSeat: Boolean(ride.maxTwoInBackSeat),
  womenOnly: resolveWomenOnly(ride),
  preferences: {
    ...fallback.preferences,
    noSmoking: Boolean(ride.noSmoking),
    noPets: Boolean(ride.noPets),
    luggage: Boolean(ride.luggageAllowed),
  },
  selectedVehicleId: ride.vehicleId ?? '',
  originLatitude: null,
  originLongitude: null,
  destinationLatitude: null,
  destinationLongitude: null,
  routeSelection: null,
  routeSelected: Boolean(ride.routeSelected),
  routeLengthMeters:
    typeof ride.routeLengthMeters === 'number' ? ride.routeLengthMeters : null,
  routeDurationSeconds:
    typeof ride.routeDurationSeconds === 'number' ? ride.routeDurationSeconds : null,
});

export type MapUpdateRideResult =
  | { ok: true; payload: UpdateRideDto }
  | { ok: false; message: string };

export const buildUpdateRidePayload = (input: {
  form: ModifyRideFormState;
  hasBookings: boolean;
  bookedSeats: number;
  seriesScope?: ApiSeriesScope;
}): MapUpdateRideResult => {
  const { form, hasBookings, bookedSeats, seriesScope } = input;
  const { min, max } = computeSeatBounds(bookedSeats);

  if (
    !Number.isInteger(form.availableSeats) ||
    form.availableSeats < min ||
    form.availableSeats > max
  ) {
    return {
      ok: false,
      message:
        bookedSeats > 0
          ? `Total seats must be between ${min} (already booked) and ${max}.`
          : `Total seats must be between ${min} and ${max}.`,
    };
  }

  // Active bookings: only totalSeats. Do not resend route/schedule/fare
  // (backend returns 409 if those change). Never send bookedSeats.
  if (hasBookings) {
    const payload: UpdateRideDto = { totalSeats: form.availableSeats };
    if (seriesScope) {
      payload.seriesScope = seriesScope;
    }
    assertUpdateRidePayload(payload);
    return { ok: true, payload };
  }

  const source = form.origin.trim();
  const destination = form.destination.trim();
  if (!source) {
    return { ok: false, message: 'Please enter a starting point.' };
  }
  if (!destination) {
    return { ok: false, message: 'Please enter a destination.' };
  }

  const departureDate = toApiDepartureDate(form.departureDate);
  if (!departureDate) {
    return { ok: false, message: 'Please select a valid departure date.' };
  }
  const departureTime = toApiDepartureTime(form.departureTime);
  if (!departureTime) {
    return { ok: false, message: 'Please select a valid departure time.' };
  }
  const pricePerSeat = parsePricePerSeat(form.pricePerSeat);
  if (pricePerSeat === null) {
    return { ok: false, message: 'Please enter a valid price per seat.' };
  }
  const vehicleId = form.selectedVehicleId.trim();
  if (!vehicleId) {
    return { ok: false, message: 'Please choose a vehicle from My Garage.' };
  }

  const payload: UpdateRideDto = {
    vehicleId,
    source,
    destination,
    departureDate,
    departureTime,
    totalSeats: form.availableSeats,
    pricePerSeat,
    maxTwoInBackSeat: Boolean(form.maxTwoInBackSeat),
    noSmoking: Boolean(form.preferences.noSmoking),
    noPets: Boolean(form.preferences.noPets),
    luggageAllowed: Boolean(form.preferences.luggage),
    womenOnly: Boolean(form.womenOnly),
  };

  if (seriesScope) {
    payload.seriesScope = seriesScope;
  }

  if (didModifyRouteChange(form)) {
    const endpoints = toRouteEndpoints(
      form.originLatitude,
      form.originLongitude,
      form.destinationLatitude,
      form.destinationLongitude,
    );
    const selection = form.routeSelection;
    if (!selection?.selectionToken?.trim()) {
      return { ok: false, message: ROUTE_SELECTION_USER_MESSAGES.required };
    }
    if (!endpoints || !selectionMatchesEndpoints(selection, endpoints)) {
      return { ok: false, message: ROUTE_SELECTION_USER_MESSAGES.stale };
    }
    payload.routeSelectionToken = selection.selectionToken;
    payload.sourceLatitude = endpoints.sourceLatitude;
    payload.sourceLongitude = endpoints.sourceLongitude;
    payload.destinationLatitude = endpoints.destinationLatitude;
    payload.destinationLongitude = endpoints.destinationLongitude;
  }

  assertUpdateRidePayload(payload);
  return { ok: true, payload };
};

export const assertUpdateRidePayload = (payload: UpdateRideDto): void => {
  const record = payload as unknown as Record<string, unknown>;
  for (const key of FORBIDDEN_UPDATE_FIELDS) {
    if (key in record) {
      throw new Error(`Client must not send ${key} on PATCH /rides/:id`);
    }
  }
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

export const mapUpdateRideError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error).trim();

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }
  if (status === 403) {
    return text || 'You can only modify rides that you own.';
  }
  if (status === 404) {
    return text || 'This ride was not found or is no longer available.';
  }
  if (isRouteSelectionTokenError(error)) {
    return mapRouteSelectionError(error);
  }

  // Seats below booked seats (or other validation).
  if (status === 400) {
    return (
      text ||
      'Total seats cannot be lower than seats already booked. Refresh and try again.'
    );
  }
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as ApiError).code ?? '').trim().toUpperCase()
      : '';
  if (code === 'COMMUTE_SERIES_OCCURRENCES_BOOKED' || text.toUpperCase().includes('COMMUTE_SERIES_OCCURRENCES_BOOKED')) {
    return (
      text ||
      'A booked occurrence in this series cannot receive that change. Refresh the ride and try a narrower update.'
    );
  }

  // Route / schedule / fare change while bookings exist.
  if (status === 409) {
    return (
      text ||
      'Trip details and fare cannot be changed while seats are booked. You can only adjust total seats.'
    );
  }
  if (status === 422) {
    return (
      text ||
      'This ride could not be updated. A booking may have been added, or the new details are not allowed.'
    );
  }
  if (status === 0) {
    return text || 'Unable to update the ride. Check your connection and try again.';
  }
  return text || 'Unable to update the ride. Please try again.';
};
