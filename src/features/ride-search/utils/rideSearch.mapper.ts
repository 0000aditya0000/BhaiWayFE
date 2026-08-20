import type { ApiError } from '@/network/network.types';

import type { RideSearchItemDto } from '../api/ridesSearch.types';
import type { RidePreference, RideResultItem } from '../types';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

/** Civil/local YYYY-MM-DD — no UTC conversion. */
export const toCivilDateFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Format backend HH:mm or HH:mm:ss for card display. */
export const formatApiDepartureTime = (value: string): string => {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) {
    return value.trim();
  }

  const hours24 = Number(match[1]);
  const minutes = match[2];
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const displayHours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${displayHours}:${minutes} ${period}`;
};

const formatCivilDateLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

/** Parse backend pricePerSeat string without altering the numeric value. */
export const parsePricePerSeat = (raw: string): number => {
  const trimmed = raw.trim();
  const amount = Number(trimmed);
  return Number.isFinite(amount) ? amount : 0;
};

const mapApiRideType = (rideType: RideSearchItemDto['rideType']): RideResultItem['rideType'] =>
  rideType === 'ASSURED' ? 'assured' : 'regular';

const mapVehicleLabel = (vehicle: RideSearchItemDto['vehicle']): string => {
  const make = vehicle.make?.trim() ?? '';
  const model = vehicle.model?.trim() ?? '';
  const label = [make, model].filter(Boolean).join(' ');
  return label || model || make || 'Car';
};

const mapPreferences = (preferences: RideSearchItemDto['preferences']): RidePreference[] => {
  const items: RidePreference[] = [];
  if (preferences.noSmoking) {
    items.push({ id: 'no-smoking', label: 'No smoking', icon: 'ban-outline' });
  }
  if (preferences.noPets) {
    items.push({ id: 'no-pets', label: 'No pets', icon: 'paw-outline' });
  }
  if (preferences.luggageAllowed) {
    items.push({ id: 'luggage', label: 'Luggage allowed', icon: 'briefcase-outline' });
  }
  if (preferences.maxTwoInBackSeat) {
    items.push({ id: 'max-two-back', label: 'Max 2 in back', icon: 'people-outline' });
  }
  return items;
};

export const mapRideSearchItemToResult = (item: RideSearchItemDto): RideResultItem => ({
  id: item.id,
  rideType: mapApiRideType(item.rideType),
  driver: {
    id: item.driver.id,
    name: item.driver.displayName?.trim() || 'BhaiWay Driver',
    rating: 4.8,
    verified: true,
    yearsDriving: 3,
    avatarUri: item.driver.profilePhoto?.trim() || undefined,
  },
  price: parsePricePerSeat(item.pricePerSeat),
  departureTime: formatApiDepartureTime(item.departureTime),
  carModel: mapVehicleLabel(item.vehicle),
  seatsLeft: Math.max(0, item.availableSeats),
  ac: true,
  luggage: item.preferences.luggageAllowed ? 'Medium' : 'Small',
  originCity: shortPlaceName(item.source),
  destinationCity: shortPlaceName(item.destination),
  distanceKm: 0,
  durationMinutes: 0,
  durationLabel: formatCivilDateLabel(item.departureDate),
  preferences: mapPreferences(item.preferences),
  features: [],
});

export const mapRideSearchItemsToResults = (
  items: readonly RideSearchItemDto[],
): RideResultItem[] => items.map(mapRideSearchItemToResult);

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

export const mapSearchRidesError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400) {
    return text.trim() || 'Please check your search details and try again.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to search rides. Check your connection and try again.';
  }

  return text.trim() || 'Unable to search rides. Please try again.';
};

export const resolveSearchDateParam = (date?: string): string | null => {
  const trimmed = date?.trim() ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};
