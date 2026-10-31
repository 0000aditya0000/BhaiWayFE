import type { BookingResponseDto } from '@/features/ride-search/api/bookings.types';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import { resolvePersonPhotoUrl } from '@/features/ride-search/api/bookingPersonPhoto';
import { formatApiDepartureTime } from '@/features/ride-search/utils/rideSearch.mapper';
import {
  contactSnapshotKeys,
  resolvePassengerContactPhone,
} from '@/features/ride-search/utils/bookingContactPhone';
import {
  formatPaymentStatusDisplayLabel,
  formatRegularRidePaymentMethodLabel,
} from '@/features/ride-search/utils/regularRidePayment.utils';

import { DEFAULT_PROFILE_AVATAR } from '../constants/my-rides.constants';
import type { ActiveTripPassenger } from '../types/active-trip.types';
import type {
  CommutePendingRequestGroup,
  DriverTrackConfirmedPassenger,
  DriverTrackPendingRequest,
  UpcomingRideRider,
} from '../types';

const parseFareAmount = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw !== 'string') {
    return 0;
  }
  const cleaned = raw.replace(/[^\d.-]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
};

const extractConversationId = (booking: BookingResponseDto): string | undefined => {
  const direct = booking.conversationId?.trim();
  if (direct) {
    return direct;
  }
  const nested =
    booking.conversation?.id?.trim() ||
    booking.chat?.conversationId?.trim() ||
    booking.chat?.id?.trim();
  return nested || undefined;
};

const ACTIVE_DRIVER_BOOKING_STATUSES = new Set([
  'CONFIRMED',
  'PENDING',
  'ACCEPTED',
  'ACTIVE',
]);

export const isActiveDriverBookingStatus = (status: string | undefined): boolean =>
  ACTIVE_DRIVER_BOOKING_STATUSES.has(String(status ?? '').trim().toUpperCase());

export const filterActiveDriverBookings = (
  rows: readonly BookingResponseDto[],
): BookingResponseDto[] =>
  rows.filter((row) => isActiveDriverBookingStatus(String(row.status)));

/** Confirmed/active driver bookings — excludes PENDING Commute requests. */
export const filterConfirmedDriverBookings = (
  rows: readonly BookingResponseDto[],
): BookingResponseDto[] =>
  rows.filter((row) => {
    const status = String(row.status ?? '').trim().toUpperCase();
    if (status === 'PENDING') {
      return false;
    }
    return isActiveDriverBookingStatus(status);
  });

const isCommuteBookingMode = (booking: BookingResponseDto): boolean =>
  String(booking.bookingMode ?? '')
    .trim()
    .toUpperCase() === 'COMMUTE';

export const isPendingCommuteBooking = (booking: BookingResponseDto): boolean =>
  isCommuteBookingMode(booking) &&
  String(booking.status ?? '').trim().toUpperCase() === 'PENDING';

export const filterPendingCommuteBookings = (
  rows: readonly BookingResponseDto[],
): BookingResponseDto[] => rows.filter(isPendingCommuteBooking);

const shortPlaceName = (value?: string | null): string => {
  if (!value?.trim()) {
    return '';
  }
  return value.split(',')[0]?.trim() || value.trim();
};

const formatRideDateLabel = (departureDate?: string | null): string => {
  const civil = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(departureDate ?? '').trim());
  if (!civil) {
    return String(departureDate ?? '').trim();
  }
  return `${civil[3]}/${civil[2]}/${civil[1]}`;
};

const resolvePassengerRating = (booking: BookingResponseDto): number | undefined => {
  const passenger = booking.passenger as
    | { rating?: number | string | null; averageRating?: number | string | null }
    | null
    | undefined;
  const raw = passenger?.rating ?? passenger?.averageRating;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
};

export const mapDriverBookingToPendingRequest = (
  booking: BookingResponseDto,
): DriverTrackPendingRequest => {
  const fareTotal = parseFareAmount(booking.totalAmount);
  const passengerName = resolvePassengerDisplayName(booking) || 'Passenger';
  const seatsBooked = Math.max(1, Math.floor(Number(booking.seats) || 1));
  const ride = booking.ride;
  const pickupLabel = shortPlaceName(ride?.source);
  const dropoffLabel = shortPlaceName(ride?.destination);
  const departureTime = ride?.departureTime
    ? formatApiDepartureTime(ride.departureTime)
    : '';
  const dateLabel = formatRideDateLabel(ride?.departureDate);
  const dateTimeLabel = [dateLabel, departureTime].filter(Boolean).join(' · ');
  const routeLabel =
    pickupLabel && dropoffLabel ? `${pickupLabel} → ${dropoffLabel}` : '';
  const rating = resolvePassengerRating(booking);
  const subtitleParts = [
    routeLabel,
    dateTimeLabel,
    seatsBooked === 1 ? '1 seat' : `${seatsBooked} seats`,
    fareTotal > 0 ? `₹${fareTotal}` : '',
    formatPaymentStatusLabel(booking.paymentStatus),
  ].filter(Boolean);

  return {
    id: booking.id,
    name: passengerName,
    subtitle: subtitleParts.join(' · '),
    rating,
    idVerified: resolvePassengerVerified(booking),
    avatarUri: resolvePersonPhotoUrl(booking.passenger) || DEFAULT_PROFILE_AVATAR,
    seatsBooked,
    fareTotal: fareTotal > 0 ? fareTotal : undefined,
    fareLabel: fareTotal > 0 ? `₹${fareTotal}` : undefined,
    pickupLabel: pickupLabel || undefined,
    dropoffLabel: dropoffLabel || undefined,
    routeLabel: routeLabel || undefined,
    dateTimeLabel: dateTimeLabel || undefined,
    bookingId: booking.id,
  };
};

export const groupPendingCommuteBookingsByRide = (
  rows: readonly BookingResponseDto[],
  rideMeta?: Readonly<
    Record<
      string,
      {
        source?: string | null;
        destination?: string | null;
        departureDate?: string | null;
        departureTime?: string | null;
        availableSeats?: number | null;
        totalSeats?: number | null;
      }
    >
  >,
): CommutePendingRequestGroup[] => {
  const grouped = new Map<string, BookingResponseDto[]>();
  for (const booking of filterPendingCommuteBookings(rows)) {
    const rideId = booking.rideId?.trim() || booking.ride?.id?.trim() || '';
    if (!rideId) {
      continue;
    }
    const list = grouped.get(rideId) ?? [];
    list.push(booking);
    grouped.set(rideId, list);
  }

  return Array.from(grouped.entries()).map(([rideId, bookings]) => {
    const meta = rideMeta?.[rideId];
    const ride = bookings[0]?.ride;
    const source = meta?.source?.trim() || ride?.source?.trim() || '';
    const destination = meta?.destination?.trim() || ride?.destination?.trim() || '';
    const departureTimeLabel = meta?.departureTime?.trim()
      ? formatApiDepartureTime(meta.departureTime)
      : ride?.departureTime
        ? formatApiDepartureTime(ride.departureTime)
        : '';
    const dateLabel = formatRideDateLabel(meta?.departureDate ?? ride?.departureDate);
    return {
      rideId,
      routeTitle: source && destination ? `${source} → ${destination}` : source || destination,
      source,
      destination,
      dateLabel,
      departureTimeLabel,
      availableSeats:
        meta?.availableSeats != null && Number.isFinite(meta.availableSeats)
          ? meta.availableSeats
          : undefined,
      totalSeats:
        meta?.totalSeats != null && Number.isFinite(meta.totalSeats)
          ? meta.totalSeats
          : undefined,
      requests: bookings.map(mapDriverBookingToPendingRequest),
    };
  });
};

export const countPendingCommuteBookingsByRideId = (
  rows: readonly BookingResponseDto[],
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const booking of filterPendingCommuteBookings(rows)) {
    const rideId = booking.rideId?.trim() || booking.ride?.id?.trim() || '';
    if (!rideId) {
      continue;
    }
    counts[rideId] = (counts[rideId] ?? 0) + 1;
  }
  return counts;
};

export const sumActiveBookedSeats = (
  rows: readonly BookingResponseDto[],
): number =>
  filterActiveDriverBookings(rows).reduce((sum, row) => {
    const seats = Math.max(0, Math.floor(Number(row.seats) || 0));
    return sum + seats;
  }, 0);

export const formatPaymentMethodLabel = (method: string | undefined): string =>
  formatRegularRidePaymentMethodLabel(method);

export const formatPaymentStatusLabel = (status: string | undefined): string =>
  formatPaymentStatusDisplayLabel(status);

const formatBookingTimeLabel = (iso: string | undefined): string => {
  if (!iso?.trim()) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.trim();
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
};

/**
 * Resolve passenger display name from whatever the booking DTO actually returns.
 * Does not invent identity — returns '' when no name fields are present.
 */
export const resolvePassengerDisplayName = (
  booking: BookingResponseDto,
): string => resolvePersonDisplayName(booking.passenger);

const resolvePassengerPhone = (booking: BookingResponseDto): string | undefined => {
  const raw = resolvePassengerContactPhone(booking);
  return raw || undefined;
};

const resolvePassengerVerified = (booking: BookingResponseDto): boolean => {
  if (booking.passenger?.isVerified === true || booking.passenger?.verified === true) {
    return true;
  }
  return false;
};

const mapVehicleLabel = (booking: BookingResponseDto): string => {
  const make = booking.vehicle?.make?.trim() ?? '';
  const model = booking.vehicle?.model?.trim() ?? '';
  const label = [make, model].filter(Boolean).join(' ');
  return label;
};

/**
 * Compact subtitle for My Rides rider rows from fields the API returns.
 * Does not invent phone, email, company, or rating.
 */
export const buildDriverBookingSubtitle = (booking: BookingResponseDto): string => {
  const parts: string[] = [];
  const status = String(booking.status ?? '').trim().toUpperCase();
  if (status) {
    parts.push(status);
  }
  const paymentStatus = formatPaymentStatusLabel(booking.paymentStatus);
  if (paymentStatus) {
    parts.push(paymentStatus);
  }
  const paymentMethod = formatPaymentMethodLabel(String(booking.paymentMethod ?? ''));
  if (paymentMethod) {
    parts.push(paymentMethod);
  }
  const fare = parseFareAmount(booking.totalAmount);
  if (fare > 0) {
    parts.push(`₹${fare}`);
  }
  return parts.join(' · ');
};

/** Map one driver booking list item → My Rides card rider row. */
export const mapDriverBookingToRider = (
  booking: BookingResponseDto,
): UpcomingRideRider => {
  const passengerName = resolvePassengerDisplayName(booking) || 'Passenger';
  const avatarUri =
    resolvePersonPhotoUrl(booking.passenger) || DEFAULT_PROFILE_AVATAR;

  return {
    id: booking.id,
    name: passengerName,
    subtitle: buildDriverBookingSubtitle(booking) || undefined,
    seatsBooked: Math.max(0, Math.floor(Number(booking.seats) || 0)),
    avatarUri,
    verified: resolvePassengerVerified(booking),
  };
};

/** Map one driver booking → Track / Ride Details confirmed passenger. */
export const mapDriverBookingToConfirmedPassenger = (
  booking: BookingResponseDto,
): DriverTrackConfirmedPassenger => {
  const seatsBooked = Math.max(0, Math.floor(Number(booking.seats) || 0));
  const bookingStatus = String(booking.status ?? '').trim().toUpperCase();
  const paymentStatus = formatPaymentStatusLabel(booking.paymentStatus);
  const paymentMethodLabel = formatPaymentMethodLabel(String(booking.paymentMethod ?? ''));
  const bookedAtLabel = formatBookingTimeLabel(booking.createdAt);
  const fareTotal = parseFareAmount(booking.totalAmount);
  const phone = resolvePassengerPhone(booking);
  const resolvedName = resolvePassengerDisplayName(booking);

  if (!phone) {
    console.log('[Ride Details] passenger phone missing on booking', {
      bookingId: booking.id,
      passengerId: booking.passengerId,
      passengerKeys: contactSnapshotKeys(booking.passenger),
    });
  }

  if (!resolvedName) {
    console.log('[Driver bookings] passenger name missing on booking', {
      bookingId: booking.id,
      passengerId: booking.passengerId,
      passengerKeys:
        booking.passenger && typeof booking.passenger === 'object'
          ? Object.keys(booking.passenger)
          : null,
      passenger: booking.passenger ?? null,
    });
  }

  return {
    id: booking.id,
    name: resolvedName || 'Passenger',
    subtitle: buildDriverBookingSubtitle(booking),
    verified: resolvePassengerVerified(booking),
    avatarUri: resolvePersonPhotoUrl(booking.passenger) || DEFAULT_PROFILE_AVATAR,
    seatsBooked,
    bookingStatus,
    paymentStatus,
    paymentMethodLabel,
    bookedAtLabel: bookedAtLabel || undefined,
    fareTotal: fareTotal > 0 ? fareTotal : undefined,
    phone,
    callAvailable: Boolean(phone),
    conversationId: extractConversationId(booking),
    chatAvailable: true,
  };
};

/** Map one driver booking → Active Trip passenger chip (live trip screen). */
export const mapDriverBookingToActiveTripPassenger = (
  booking: BookingResponseDto,
): ActiveTripPassenger => {
  const pickupStatus = String(booking.pickupStatus ?? '').trim().toUpperCase();
  return {
    id: booking.id,
    name: resolvePassengerDisplayName(booking) || 'Passenger',
    avatarUri: resolvePersonPhotoUrl(booking.passenger) || DEFAULT_PROFILE_AVATAR,
    isOnline: pickupStatus === 'PICKED_UP',
  };
};

/** Group active driver bookings by rideId for attaching to GET /rides/my cards. */
export const groupActiveDriverBookingsByRideId = (
  rows: readonly BookingResponseDto[],
): Record<string, UpcomingRideRider[]> => {
  const grouped: Record<string, UpcomingRideRider[]> = {};
  for (const booking of filterConfirmedDriverBookings(rows)) {
    const rideId = booking.rideId?.trim();
    if (!rideId) {
      continue;
    }
    if (!grouped[rideId]) {
      grouped[rideId] = [];
    }
    grouped[rideId].push(mapDriverBookingToRider(booking));
  }
  return grouped;
};

/** Prefer booking vehicle snapshot; otherwise leave empty for caller to fill. */
export const mapDriverBookingVehicleLabel = (
  bookings: readonly BookingResponseDto[],
): string => {
  for (const booking of bookings) {
    const label = mapVehicleLabel(booking);
    if (label) {
      return label;
    }
  }
  return '';
};
