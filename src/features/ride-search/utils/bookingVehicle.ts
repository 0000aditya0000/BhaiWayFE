import type { BookingResponseDto, BookingVehicleSnapshotDto } from '../api/bookings.types';
import type { RideSearchItemDto, RideSearchVehicleDto } from '../api/ridesSearch.types';
import { rideVehicleCache, type RideVehicleRecord } from './rideVehicleCache';

const GENERIC_VEHICLE_LABEL = 'Vehicle';

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/** Accept camelCase or snake_case from backend snapshots. */
const readRegistrationNumber = (
  vehicle: BookingVehicleSnapshotDto | RideSearchVehicleDto | null | undefined,
): string => {
  if (!vehicle || typeof vehicle !== 'object') {
    return '';
  }
  const record = vehicle as Record<string, unknown>;
  return (
    readText(record.registrationNumber) ||
    readText(record.registration_number) ||
    readText(record.plateNumber) ||
    readText(record.plate_number)
  ).toUpperCase();
};

export const hasBookingVehicleSnapshot = (
  vehicle: BookingVehicleSnapshotDto | null | undefined,
): boolean => {
  if (!vehicle) {
    return false;
  }
  return Boolean(
    readText(vehicle.make) ||
      readText(vehicle.model) ||
      readRegistrationNumber(vehicle),
  );
};

export const resolveBookingVehicleLabel = (
  vehicle: BookingVehicleSnapshotDto | RideSearchVehicleDto | null | undefined,
  fallback?: string,
): string => {
  if (!vehicle) {
    return fallback?.trim() || GENERIC_VEHICLE_LABEL;
  }
  const make = readText(vehicle.make);
  const model = readText(vehicle.model);
  const color = readText(vehicle.color);
  const makeModel = [make, model].filter(Boolean).join(' ');
  if (makeModel && color) {
    return `${color} ${makeModel}`;
  }
  if (makeModel) {
    return makeModel;
  }
  return fallback?.trim() || GENERIC_VEHICLE_LABEL;
};

export const resolveBookingVehiclePlate = (
  vehicle: BookingVehicleSnapshotDto | RideSearchVehicleDto | null | undefined,
): string => readRegistrationNumber(vehicle);

export const bookingVehicleFromPublicRide = (
  vehicle: RideSearchVehicleDto,
): BookingVehicleSnapshotDto => ({
  id: vehicle.id,
  make: vehicle.make,
  model: vehicle.model,
  variant: vehicle.variant ?? null,
  color: vehicle.color ?? null,
  vehicleType: vehicle.vehicleType,
});

export const bookingVehicleFromCache = (
  cached: RideVehicleRecord,
): BookingVehicleSnapshotDto => ({
  make: cached.make,
  model: cached.model,
  color: cached.color ?? null,
});

export const vehicleSnapshotFromRideId = (
  rideId: string,
): BookingVehicleSnapshotDto | null => {
  const cached = rideVehicleCache.getSync(rideId);
  if (!cached) {
    return null;
  }
  if (cached.make || cached.model) {
    return bookingVehicleFromCache(cached);
  }
  if (cached.vehicleLabel && cached.vehicleLabel !== GENERIC_VEHICLE_LABEL) {
    const parts = cached.vehicleLabel.split(/\s+/);
    return {
      make: parts[0],
      model: parts.slice(1).join(' ') || parts[0],
    };
  }
  return null;
};

export const resolveVehicleLabelForRide = (
  rideId: string,
  vehicle: BookingVehicleSnapshotDto | null | undefined,
  fallback?: string,
): string => {
  if (hasBookingVehicleSnapshot(vehicle)) {
    return resolveBookingVehicleLabel(vehicle, fallback);
  }
  const cached = rideVehicleCache.getSync(rideId);
  if (cached?.vehicleLabel) {
    return cached.vehicleLabel;
  }
  return fallback?.trim() || GENERIC_VEHICLE_LABEL;
};

export const resolveVehiclePlateForRide = (
  rideId: string,
  vehicle: BookingVehicleSnapshotDto | null | undefined,
): string => {
  const fromBooking = resolveBookingVehiclePlate(vehicle);
  if (fromBooking) {
    return fromBooking;
  }
  return rideVehicleCache.getSync(rideId)?.plateNumber?.trim() || '';
};

/**
 * When GET /bookings/my omits vehicle snapshot, hydrate from on-device cache
 * then GET /rides/public/:id (published rides only — IN_PROGRESS returns 404).
 */
export const enrichBookingsWithPublicRideVehicles = async (
  bookings: readonly BookingResponseDto[],
  fetchPublicRide: (rideId: string) => Promise<RideSearchItemDto>,
): Promise<BookingResponseDto[]> => {
  await rideVehicleCache.hydrate();

  const needsRemote: string[] = [];

  const withCache = bookings.map((booking) => {
    if (hasBookingVehicleSnapshot(booking.vehicle)) {
      return booking;
    }
    const rideId = booking.rideId?.trim() || booking.ride?.id?.trim() || '';
    const cachedSnapshot = rideId ? vehicleSnapshotFromRideId(rideId) : null;
    if (cachedSnapshot) {
      return { ...booking, vehicle: cachedSnapshot };
    }
    if (rideId) {
      needsRemote.push(rideId);
    }
    return booking;
  });

  const missingRideIds = [...new Set(needsRemote)];
  if (missingRideIds.length === 0) {
    return withCache;
  }

  const publicByRideId = new Map<string, RideSearchItemDto>();
  await Promise.all(
    missingRideIds.map(async (rideId) => {
      try {
        const ride = await fetchPublicRide(rideId);
        if (ride?.vehicle) {
          publicByRideId.set(rideId, ride);
          await rideVehicleCache.save({
            rideId,
            vehicleLabel: resolveBookingVehicleLabel(ride.vehicle),
            make: ride.vehicle.make,
            model: ride.vehicle.model,
            color: ride.vehicle.color ?? undefined,
          });
        }
      } catch (error) {
        console.log('[Bookings] public ride vehicle fallback failed', { rideId, error });
      }
    }),
  );

  if (publicByRideId.size === 0) {
    return withCache;
  }

  return withCache.map((booking) => {
    if (hasBookingVehicleSnapshot(booking.vehicle)) {
      return booking;
    }
    const rideId = booking.rideId?.trim() || booking.ride?.id?.trim() || '';
    const publicRide = rideId ? publicByRideId.get(rideId) : undefined;
    if (!publicRide?.vehicle) {
      return booking;
    }
    return {
      ...booking,
      vehicle: bookingVehicleFromPublicRide(publicRide.vehicle),
    };
  });
};
