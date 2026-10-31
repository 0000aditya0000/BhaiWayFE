import { listMyRides } from '@/features/offer-ride/api';
import type { RideResponseDto } from '@/features/offer-ride/api/rides.types';
import {
  mapRideStatusLabel,
  normalizeRideStatus,
} from '@/features/offer-ride/utils/mapRideStatusLabel';
import { listVehicles } from '@/features/profile/api';
import type { VehicleResponse } from '@/features/profile/api/vehicle.api';
import { listDriverBookings, listMyBookings } from '@/features/ride-search/api';
import type { BookingResponseDto } from '@/features/ride-search/api/bookings.types';
import {
  mapBookingToBookedRideDetails,
  resolveDriverDisplayName,
} from '@/features/ride-search/api/bookings.mapper';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import { resolvePersonPhotoUrl } from '@/features/ride-search/api/bookingPersonPhoto';
import { DEFAULT_PROFILE_AVATAR } from '@/features/my-rides/constants';

import { EMPTY_EMERGENCY_RIDE } from '../constants/emergency-assistance.constants';
import type { EmergencyRideSummary } from '../types';

export { EMPTY_EMERGENCY_RIDE };

const shortPlace = (value?: string | null): string => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.split(',')[0]?.trim() || trimmed;
};

const isInProgressRide = (status: string | null | undefined): boolean =>
  normalizeRideStatus(status) === 'IN_PROGRESS';

const isLivePassengerBooking = (booking: BookingResponseDto): boolean => {
  const bookingStatus = String(booking.status ?? '')
    .trim()
    .toUpperCase();
  if (
    bookingStatus !== 'CONFIRMED' &&
    bookingStatus !== 'ACCEPTED' &&
    bookingStatus !== 'ACTIVE'
  ) {
    return false;
  }
  return isInProgressRide(booking.ride?.status);
};

const vehicleLabelFromGarage = (vehicle: VehicleResponse | undefined): string => {
  if (!vehicle) {
    return 'Vehicle';
  }
  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
  const color = vehicle.color?.trim();
  if (makeModel && color) {
    return `${color} ${makeModel}`;
  }
  return makeModel || 'Vehicle';
};

const mapPassengerBooking = (booking: BookingResponseDto): EmergencyRideSummary => {
  const details = mapBookingToBookedRideDetails(booking);
  const rideInProgress = isInProgressRide(booking.ride?.status);
  return {
    hasActiveRide: true,
    rideId: booking.ride?.id?.trim() || null,
    role: 'rider',
    driverName: resolveDriverDisplayName(booking) || details.driverName || 'Driver',
    vehicleLabel: details.vehicle || details.driverSubtitle || 'Vehicle',
    plateNumber: details.plateNumber || '—',
    locationLabel:
      (rideInProgress ? details.dropoff : details.pickup) ||
      shortPlace(booking.ride?.destination) ||
      shortPlace(booking.ride?.source) ||
      'Location unavailable',
    avatarUri: resolvePersonPhotoUrl(booking.driver) || DEFAULT_PROFILE_AVATAR,
    statusLabel: mapRideStatusLabel(booking.ride?.status, booking.ride?.rideType),
  };
};

const mapDriverRide = (
  ride: RideResponseDto,
  vehicle: VehicleResponse | undefined,
  passengerName: string | null,
  passengerAvatar: string | null,
): EmergencyRideSummary => ({
  hasActiveRide: true,
  rideId: ride.id?.trim() || null,
  role: 'driver',
  driverName: passengerName?.trim() || 'Your trip',
  vehicleLabel: vehicleLabelFromGarage(vehicle),
  plateNumber: vehicle?.registrationNumber?.trim().toUpperCase() || '—',
  locationLabel:
    shortPlace(ride.destination) || shortPlace(ride.source) || 'Location unavailable',
  avatarUri: passengerAvatar?.trim() || DEFAULT_PROFILE_AVATAR,
  statusLabel: mapRideStatusLabel(ride.status, ride.rideType),
});

/**
 * Resolve the user's live trip for Emergency Assistance.
 * Prefers passenger IN_PROGRESS bookings, then driver IN_PROGRESS rides.
 */
export const resolveEmergencyActiveRide = async (): Promise<EmergencyRideSummary> => {
  const [myBookings, myRides] = await Promise.all([
    listMyBookings().catch(() => [] as BookingResponseDto[]),
    listMyRides().catch(() => [] as RideResponseDto[]),
  ]);

  const passengerLive = myBookings.find(isLivePassengerBooking);
  if (passengerLive) {
    return mapPassengerBooking(passengerLive);
  }

  const driverLive = myRides.find((ride) => isInProgressRide(ride.status));
  if (driverLive) {
    const [vehicles, driverBookings] = await Promise.all([
      listVehicles().catch(() => [] as VehicleResponse[]),
      listDriverBookings({ rideId: driverLive.id }).catch(() => [] as BookingResponseDto[]),
    ]);
    const vehicle = vehicles.find((item) => item.id === driverLive.vehicleId);
    const confirmedPassenger = driverBookings.find((row) => {
      const status = String(row.status ?? '')
        .trim()
        .toUpperCase();
      return status === 'CONFIRMED' || status === 'ACCEPTED' || status === 'ACTIVE';
    });
    return mapDriverRide(
      driverLive,
      vehicle,
      confirmedPassenger ? resolvePersonDisplayName(confirmedPassenger.passenger) : null,
      resolvePersonPhotoUrl(confirmedPassenger?.passenger) || null,
    );
  }

  return EMPTY_EMERGENCY_RIDE;
};
