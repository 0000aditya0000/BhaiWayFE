import type { ApiError } from '@/network/network.types';

import type { BookingResponseDto, CancelBookingResultDto } from '../api/bookings.types';
import { resolvePersonDisplayName } from '../api/bookingPersonName';
import { resolvePersonPhotoUrl } from '../api/bookingPersonPhoto';
import type { BookedRideDetails, BookingFareBreakdown, ReviewBookingData } from '../types';
import {
  resolveBookingVehicleLabel,
  resolveVehicleLabelForRide,
  resolveVehiclePlateForRide,
} from '../utils/bookingVehicle';
import {
  formatApiDepartureTime,
  parsePricePerSeat,
} from '../utils/rideSearch.mapper';
import {
  couponErrorUserMessage,
  isCouponAudienceMismatchError,
} from '@/features/coupons/utils/couponErrors';
import {
  isWomenOnlyRideError,
  WOMEN_ONLY_RIDE_MESSAGE,
} from '@/shared/utils/womenOnlyRide';
import { isWalletAccessForbiddenMessage } from '../utils/regularRidePayment.utils';

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

/** Regular estimated fare before booking — never sent to POST /bookings. */
export const buildRegularFareEstimate = (
  pricePerSeat: number,
  seats: number,
): BookingFareBreakdown => {
  const safeSeats = Math.max(1, Math.floor(seats));
  const rideFare = Math.max(0, pricePerSeat) * safeSeats;
  return {
    rideFare,
    platformFee: 0,
    promoDiscount: 0,
    assuredFee: 0,
    total: rideFare,
  };
};

export const parseMoneySnapshot = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    return parsePricePerSeat(raw);
  }
  return 0;
};

export const resolveDriverDisplayName = (
  booking: BookingResponseDto,
): string => resolvePersonDisplayName(booking.driver);

/** Authoritative ride id for ratings, tracking, and post-trip navigation. */
export const resolveBookingRideId = (
  booking: Pick<BookingResponseDto, 'rideId' | 'ride'>,
): string =>
  booking.rideId?.trim() || booking.ride?.id?.trim() || '';

export const mapBookingToBookedRideDetails = (
  booking: BookingResponseDto,
  fallbacks?: {
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    plateNumber?: string;
  },
): BookedRideDetails => {
  const ride = booking.ride;
  const departureDate = ride?.departureDate
    ? formatCivilDateLabel(ride.departureDate)
    : '';
  const departureTime = ride?.departureTime
    ? formatApiDepartureTime(ride.departureTime)
    : '';
  const dateTimeLabel = [departureDate, departureTime].filter(Boolean).join(' | ') || '—';
  const resolvedDriverName = resolveDriverDisplayName(booking);

  if (!resolvedDriverName && !fallbacks?.driverName?.trim()) {
    console.log('[Bookings] driver name missing on booking', {
      bookingId: booking.id,
      rideId: booking.rideId,
      driverKeys:
        booking.driver && typeof booking.driver === 'object'
          ? Object.keys(booking.driver)
          : null,
      driver: booking.driver ?? null,
    });
  }

  return {
    rideId: resolveBookingRideId(booking),
    bookingId: booking.id,
    rideType: booking.bookingMode === 'ASSURED' || ride?.rideType === 'ASSURED' ? 'assured' : 'regular',
    driverName:
      resolvedDriverName ||
      fallbacks?.driverName?.trim() ||
      'Driver',
    driverSubtitle: resolveVehicleLabelForRide(
      booking.rideId,
      booking.vehicle,
      fallbacks?.carModel,
    ),
    pickup:
      shortPlaceName(ride?.source ?? '') ||
      shortPlaceName(fallbacks?.origin ?? '') ||
      'Pickup',
    dropoff:
      shortPlaceName(ride?.destination ?? '') ||
      shortPlaceName(fallbacks?.destination ?? '') ||
      'Drop-off',
    vehicle: resolveVehicleLabelForRide(
      booking.rideId,
      booking.vehicle,
      fallbacks?.carModel,
    ),
    plateNumber:
      resolveVehiclePlateForRide(booking.rideId, booking.vehicle) ||
      fallbacks?.plateNumber?.trim() ||
      '',
    dateTimeLabel,
    meetTimeLabel: departureTime || '—',
    seats: booking.seats,
    fareTotal: parseMoneySnapshot(booking.fareAmount ?? booking.totalAmount),
    pricePerSeat: parseMoneySnapshot(booking.pricePerSeatSnapshot),
    paymentMethod: String(booking.paymentMethod ?? 'PAY_LATER'),
    paymentStatus: String(booking.paymentStatus ?? 'UNPAID'),
    bookingStatus: String(booking.status ?? 'CONFIRMED'),
    securityDepositAmount:
      booking.securityDepositAmount != null
        ? parseMoneySnapshot(booking.securityDepositAmount)
        : undefined,
    securityDepositStatus: booking.securityDepositStatus
      ? String(booking.securityDepositStatus)
      : undefined,
    securityDepositPercentage:
      booking.securityDepositPercentage != null
        ? booking.securityDepositPercentage
        : undefined,
    fareAmount:
      booking.fareAmount != null
        ? parseMoneySnapshot(booking.fareAmount)
        : parseMoneySnapshot(booking.totalAmount),
    farePayment: booking.farePayment ? String(booking.farePayment) : undefined,
    farePaymentStatus: booking.farePaymentStatus
      ? String(booking.farePaymentStatus)
      : undefined,
  };
};

export const mapBookingResponseToReviewOverlay = (
  booking: BookingResponseDto,
): Pick<ReviewBookingData, 'pickup' | 'dropoff' | 'driver' | 'maxPassengers'> | null => {
  const ride = booking.ride;
  if (!ride) {
    return null;
  }
  return {
    pickup: {
      label: 'PICKUP',
      address: ride.source,
      latitude: 0,
      longitude: 0,
    },
    dropoff: {
      label: 'DROP-OFF',
      address: ride.destination,
      latitude: 0,
      longitude: 0,
    },
    driver: {
      id: booking.driver?.id ?? 'driver',
      name: resolveDriverDisplayName(booking) || 'Driver',
      subtitle: resolveBookingVehicleLabel(booking.vehicle),
      rating: 4.8,
      totalRides: 0,
      avatarUri: resolvePersonPhotoUrl(booking.driver) || undefined,
    },
    maxPassengers: booking.seats,
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

export const mapCreateBookingError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (isWomenOnlyRideError(error)) {
    return WOMEN_ONLY_RIDE_MESSAGE;
  }

  if (isCouponAudienceMismatchError(error, text)) {
    return couponErrorUserMessage(error, text.trim() || 'This coupon is not eligible for this booking.');
  }

  if (status === 403) {
    if (isWalletAccessForbiddenMessage(text)) {
      return (
        text.trim() ||
        'Your BhaiWay Wallet is locked. You cannot pay from wallet right now.'
      );
    }
    return (
      text.trim() ||
      'Identity verification is required before you can book a ride.'
    );
  }

  if (status === 409) {
    return (
      text.trim() ||
      'Sorry, these seats are no longer available. Please search again.'
    );
  }

  if (status === 404) {
    return text.trim() || 'This ride is no longer available. Please search again.';
  }

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400 || status === 422) {
    if (status === 422) {
      return (
        text.trim() ||
        'Insufficient BhaiWay Coins for this booking. Add coins and try again.'
      );
    }
    return text.trim() || 'Unable to complete this booking. Please check your details and try again.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to book this ride. Check your connection and try again.';
  }

  return text.trim() || 'Unable to book this ride. Please try again.';
};

export const isCancelAlreadyApplied = (result: CancelBookingResultDto | null | undefined): boolean => {
  if (!result) {
    return false;
  }
  if (result.alreadyApplied === true) {
    return true;
  }
  return String(result.status ?? '').trim().toUpperCase() === 'CANCELLED';
};

export const mapCancelBookingError = (error: unknown): string => {
  const status = getErrorStatus(error);
  const text = getErrorText(error);

  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 400 || status === 403 || status === 409 || status === 422) {
    return text.trim() || 'Unable to cancel this booking right now.';
  }

  if (status === 0) {
    return text.trim() || 'Unable to cancel. Check your connection and try again.';
  }

  return text.trim() || 'Unable to cancel this booking. Please try again.';
};
