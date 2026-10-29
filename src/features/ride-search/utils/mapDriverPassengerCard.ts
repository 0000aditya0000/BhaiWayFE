import type {
  RideSearchDriverDto,
  RideSearchDriverRecentRideDto,
  RideSearchVehicleDto,
} from '../api/ridesSearch.types';
import type { DriverRecentRideStatusId, DriverRecentRideStatusItem } from '../constants/driver-recent-rides.constants';
import { DRIVER_RECENT_RIDE_STATUS_META } from '../constants/driver-recent-rides.constants';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value.trim();
};

const formatCivilDateLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const parseRatingNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/** Resolve as-driver averages from nested `rating` or legacy flat fields. */
export const mapDriverRatingFromSearch = (
  driver: RideSearchDriverDto | null | undefined,
): { averageRating: number; totalRatings: number } => {
  if (!driver) {
    return { averageRating: 0, totalRatings: 0 };
  }

  if (driver.rating && typeof driver.rating === 'object' && !Array.isArray(driver.rating)) {
    return {
      averageRating: parseRatingNumber(driver.rating.averageRating),
      totalRatings: Math.max(0, Math.floor(parseRatingNumber(driver.rating.totalRatings))),
    };
  }

  return {
    averageRating: parseRatingNumber(driver.rating ?? driver.averageRating),
    totalRatings: Math.max(0, Math.floor(parseRatingNumber(driver.totalRatings))),
  };
};

const mapRecentRideStatus = (status: string): DriverRecentRideStatusId | null => {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'COMPLETED') {
    return 'completed';
  }
  if (normalized === 'CANCELLED') {
    return 'cancelled';
  }
  return null;
};

export const mapDriverRecentRidesFromSearch = (
  rides: readonly RideSearchDriverRecentRideDto[] | null | undefined,
): DriverRecentRideStatusItem[] => {
  if (!Array.isArray(rides) || rides.length === 0) {
    return [];
  }

  const mapped: DriverRecentRideStatusItem[] = [];
  for (const ride of rides) {
    if (!ride || typeof ride !== 'object') {
      continue;
    }
    const status = mapRecentRideStatus(String(ride.status ?? ''));
    if (!status) {
      continue;
    }
    const id = String(ride.id ?? '').trim();
    if (!id) {
      continue;
    }
    const source = shortPlaceName(String(ride.source ?? ''));
    const destination = shortPlaceName(String(ride.destination ?? ''));
    mapped.push({
      id,
      status,
      label: DRIVER_RECENT_RIDE_STATUS_META[status].label,
      dateLabel: formatCivilDateLabel(String(ride.date ?? '')),
      routeLabel:
        source && destination
          ? `${source} → ${destination}`
          : source || destination || 'Trip',
    });
    if (mapped.length >= 5) {
      break;
    }
  }
  return mapped;
};

/** Passenger-facing vehicle label: make + model (+ variant when useful). */
export const mapVehicleLabelFromSearch = (
  vehicle: RideSearchVehicleDto | null | undefined,
): string => {
  if (!vehicle) {
    return 'Car';
  }
  const make = vehicle.make?.trim() ?? '';
  const model = vehicle.model?.trim() ?? '';
  const variant = vehicle.variant?.trim() ?? '';
  const base = [make, model].filter(Boolean).join(' ');
  if (base && variant && !base.toLowerCase().includes(variant.toLowerCase())) {
    return `${base} ${variant}`.trim();
  }
  return base || model || make || 'Car';
};

export const mapVehicleColorFromSearch = (
  vehicle: RideSearchVehicleDto | null | undefined,
): string => vehicle?.color?.trim() || '';
