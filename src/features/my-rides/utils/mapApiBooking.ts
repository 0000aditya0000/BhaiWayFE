import type { BookingResponseDto } from '@/features/ride-search/api';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import { resolvePersonPhotoUrl } from '@/features/ride-search/api/bookingPersonPhoto';
import {
  resolveVehicleLabelForRide,
  resolveVehiclePlateForRide,
} from '@/features/ride-search/utils/bookingVehicle';
import {
  formatApiDepartureTime,
  parsePricePerSeat,
} from '@/features/ride-search/utils';
import { isValidMapCoordinate, rideCoordsCache } from '@/shared/maps';

import { DEFAULT_PROFILE_AVATAR } from '../constants';
import type { HistoryRideItem, UpcomingRideSummary } from '../types';
import { isCommuteApiBooking } from './commuteMyRides.utils';
import { resolveHistoryEndedMs, resolveUpcomingDepartureMs } from './sortMyRides';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const formatCivilDateLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const otpFromBooking = (booking: BookingResponseDto): string => {
  const otp = booking.pickupOtp;
  if (typeof otp === 'string' && /^\d{4}$/.test(otp.trim())) {
    return otp.trim();
  }
  return '';
};

/**
 * Show rider OTP until the driver verifies pickup OTP.
 * Start Ride (IN_PROGRESS) alone must NOT hide OTP.
 */
const shouldShowPickupOtp = (booking: BookingResponseDto): boolean => {
  const pickupStatus = String(booking.pickupStatus ?? '').toUpperCase();
  if (
    pickupStatus === 'PICKED_UP' ||
    pickupStatus === 'VERIFIED' ||
    pickupStatus === 'COMPLETED'
  ) {
    return false;
  }
  if (booking.pickupVerifiedAt) {
    return false;
  }
  const rideStatus = String(booking.ride?.status ?? '').toUpperCase();
  if (rideStatus === 'COMPLETED' || rideStatus === 'CANCELLED') {
    return false;
  }
  return true;
};

const vehicleLabel = (booking: BookingResponseDto): string =>
  resolveVehicleLabelForRide(booking.rideId, booking.vehicle);

const vehiclePlate = (booking: BookingResponseDto): string =>
  resolveVehiclePlateForRide(booking.rideId, booking.vehicle);

const isAssuredBooking = (booking: BookingResponseDto): boolean =>
  booking.bookingMode === 'ASSURED' || booking.ride?.rideType === 'ASSURED';

const isUpcomingBookingStatus = (status: string): boolean => {
  const normalized = status.toUpperCase();
  return (
    normalized === 'CONFIRMED' ||
    normalized === 'PENDING' ||
    normalized === 'ACCEPTED' ||
    normalized === 'ACTIVE'
  );
};

const isHistoryBookingStatus = (status: string): boolean => {
  const normalized = status.toUpperCase();
  return (
    normalized === 'CANCELLED' ||
    normalized === 'COMPLETED' ||
    normalized === 'NO_SHOW'
  );
};

/** Map GET /bookings/my item → My Rides rider upcoming card. */
export const mapApiBookingToUpcoming = (
  booking: BookingResponseDto,
): UpcomingRideSummary => {
  const ride = booking.ride;
  const datePart = ride?.departureDate ? formatCivilDateLabel(ride.departureDate) : '';
  const timePart = ride?.departureTime
    ? formatApiDepartureTime(ride.departureTime)
    : '';
  const dateLabel = [datePart, timePart].filter(Boolean).join(', ').toUpperCase() || 'UPCOMING';
  const driverName = resolvePersonDisplayName(booking.driver);
  const label = vehicleLabel(booking);
  const plate = vehiclePlate(booking);

  if (!driverName) {
    console.log('[My Rides] driver name missing on passenger booking', {
      bookingId: booking.id,
      rideId: booking.rideId,
      driverKeys:
        booking.driver && typeof booking.driver === 'object'
          ? Object.keys(booking.driver)
          : null,
      driver: booking.driver ?? null,
    });
  }

  if (!label || label === 'Vehicle') {
    const cached = resolveVehicleLabelForRide(booking.rideId, null);
    if (cached === 'Vehicle') {
      console.log('[My Rides] vehicle snapshot missing on passenger booking', {
        bookingId: booking.id,
        rideId: booking.rideId,
        vehicle: booking.vehicle ?? null,
      });
    }
  }

  const peer = {
    name: driverName || 'Driver',
    vehicleLabel: label,
    plateNumber: plate,
    verified: true,
    avatarUri: resolvePersonPhotoUrl(booking.driver) || DEFAULT_PROFILE_AVATAR,
  };

  const isCommute = isCommuteApiBooking(booking);
  const bookingStatus = String(booking.status ?? '').toUpperCase();
  const title = isCommute
    ? bookingStatus === 'PENDING'
      ? 'Waiting for driver acceptance'
      : 'Commute ride confirmed'
    : isAssuredBooking(booking)
      ? 'Assured Ride Confirmed'
      : 'Ride Confirmed';

  return {
    id: booking.id,
    bookingId: booking.id,
    rideId: booking.rideId,
    rideStatus: ride?.status ? String(ride.status) : undefined,
    dateLabel,
    title,
    assured: isAssuredBooking(booking),
    commute: isCommute,
    otp: shouldShowPickupOtp(booking) ? otpFromBooking(booking) : '',
    pickupLabel: shortPlaceName(ride?.source ?? '') || 'Pickup',
    dropoffLabel: shortPlaceName(ride?.destination ?? '') || 'Drop-off',
    pickup: (() => {
      const rideId = booking.rideId?.trim() || '';
      const cached = rideId ? rideCoordsCache.getSync(rideId) : null;
      return isValidMapCoordinate(cached?.origin) ? cached!.origin! : null;
    })(),
    dropoff: (() => {
      const rideId = booking.rideId?.trim() || '';
      const cached = rideId ? rideCoordsCache.getSync(rideId) : null;
      return isValidMapCoordinate(cached?.destination) ? cached!.destination! : null;
    })(),
    peer,
    driver: peer,
    role: 'rider',
    seatsBooked: booking.seats,
    fareTotal: parsePricePerSeat(String(booking.totalAmount ?? '0')),
    paymentStatus: String(booking.paymentStatus ?? ''),
    bookingStatus: String(booking.status ?? ''),
    sortAtMs: resolveUpcomingDepartureMs(ride?.departureDate, ride?.departureTime),
  };
};

export const mapApiBookingToHistory = (booking: BookingResponseDto): HistoryRideItem => {
  const upcoming = mapApiBookingToUpcoming(booking);
  const status = String(booking.status ?? '').toUpperCase();
  const cancelled = status === 'CANCELLED';
  return {
    id: booking.id,
    bookingId: booking.id,
    rideId: booking.rideId?.trim() || booking.ride?.id?.trim() || undefined,
    title: cancelled ? 'Ride Cancelled' : 'Trip Completed',
    routeLabel: `${upcoming.pickupLabel} → ${upcoming.dropoffLabel}`,
    dateLabel: upcoming.dateLabel,
    statusLabel: cancelled ? 'Cancelled' : 'Completed',
    status,
    pickupLabel: upcoming.pickupLabel,
    dropoffLabel: upcoming.dropoffLabel,
    pickup: upcoming.pickup,
    dropoff: upcoming.dropoff,
    role: 'rider',
    assured: upcoming.assured,
    commute: upcoming.commute,
    sortAtMs: resolveHistoryEndedMs({
      pickupVerifiedAt: booking.pickupVerifiedAt,
      departureDate: booking.ride?.departureDate,
      departureTime: booking.ride?.departureTime,
      updatedAt: booking.updatedAt,
      createdAt: booking.createdAt,
    }),
  };
};

export const filterUpcomingApiBookings = (
  rows: readonly BookingResponseDto[],
): BookingResponseDto[] => rows.filter((row) => isUpcomingBookingStatus(String(row.status)));

export const filterHistoryApiBookings = (
  rows: readonly BookingResponseDto[],
): BookingResponseDto[] => rows.filter((row) => isHistoryBookingStatus(String(row.status)));
