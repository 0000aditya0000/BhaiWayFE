import type {
  BookingCoPassengerSnapshotDto,
  BookingResponseDto,
} from '@/features/ride-search/api';
import type { RideSearchItemDto } from '@/features/ride-search/api/ridesSearch.types';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import { resolveDriverPhotoUrl, resolvePersonPhotoUrl } from '@/features/ride-search/api/bookingPersonPhoto';
import {
  formatApiDepartureTime,
  parsePricePerSeat,
} from '@/features/ride-search/utils';
import {
  contactSnapshotKeys,
  resolveDriverContactPhone,
} from '@/features/ride-search/utils/bookingContactPhone';
import {
  resolveBookingVehicleLabel,
  resolveBookingVehiclePlate,
} from '@/features/ride-search/utils/bookingVehicle';

import { DEFAULT_PROFILE_AVATAR } from '../constants';
import type { DriverTrackConfirmedPassenger } from '../types';
import type { RiderCoPassenger } from '../types/rider-co-passenger.types';
import type { RiderBookedRideSummary } from '../types/rider-booked-ride.types';
import { formatBookingSecurityDepositLabel } from './assuredDepositLabel';
import { formatPaymentMethodLabel } from './mapDriverBooking';
import { formatPassengerPaymentStatusLabel } from '@/features/ride-search/utils/regularRidePayment.utils';
import { mapRideSourceToPreferenceRules } from '@/features/ride-search/utils/mapRidePreferences';
import { resolveWomenOnly } from '@/shared/utils/womenOnlyRide';

const ACTIVE_CO_PASSENGER_STATUSES = new Set([
  'CONFIRMED',
  'PENDING',
  'ACCEPTED',
  'ACTIVE',
]);

const isActiveCoPassengerBooking = (status: string | undefined): boolean =>
  ACTIVE_CO_PASSENGER_STATUSES.has(String(status ?? '').trim().toUpperCase());

const readPersonFromSnapshot = (
  snapshot: BookingCoPassengerSnapshotDto | BookingResponseDto['passenger'],
): {
  id: string;
  name: string;
  company: string;
  verified: boolean;
  avatarUri?: string;
  seatsBooked: number;
} | null => {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const nestedPassenger =
    'passenger' in snapshot && snapshot.passenger && typeof snapshot.passenger === 'object'
      ? snapshot.passenger
      : snapshot;

  const name = resolvePersonDisplayName(nestedPassenger);
  if (!name) {
    return null;
  }

  const id =
    asTrimmed('id' in snapshot ? snapshot.id : undefined) ||
    asTrimmed('bookingId' in snapshot ? snapshot.bookingId : undefined) ||
    asTrimmed('passengerId' in snapshot ? snapshot.passengerId : undefined) ||
    name;

  const company = asTrimmed(
    'company' in nestedPassenger ? nestedPassenger.company : undefined,
  );
  const seatsRaw =
    'seats' in snapshot && snapshot.seats != null
      ? snapshot.seats
      : 'seats' in (snapshot as BookingResponseDto)
        ? (snapshot as BookingResponseDto).seats
        : 1;

  return {
    id,
    name,
    company,
    verified:
      nestedPassenger?.isVerified === true || nestedPassenger?.verified === true,
    avatarUri:
      resolvePersonPhotoUrl(nestedPassenger) ||
      resolvePersonPhotoUrl(snapshot) ||
      DEFAULT_PROFILE_AVATAR,
    seatsBooked: Math.max(1, Math.floor(Number(seatsRaw) || 1)),
  };
};

const collectCoPassengerSnapshots = (
  booking: BookingResponseDto,
  publicRide?: RideSearchItemDto | null,
): BookingCoPassengerSnapshotDto[] => {
  const rows: BookingCoPassengerSnapshotDto[] = [];

  const pushArray = (value: unknown) => {
    if (!Array.isArray(value)) {
      return;
    }
    for (const item of value) {
      if (item && typeof item === 'object') {
        rows.push(item as BookingCoPassengerSnapshotDto);
      }
    }
  };

  pushArray(booking.coPassengers);
  pushArray(booking.fellowPassengers);
  pushArray(booking.otherPassengers);

  if (Array.isArray(booking.otherBookings)) {
    for (const other of booking.otherBookings) {
      if (!isActiveCoPassengerBooking(String(other.status ?? ''))) {
        continue;
      }
      if (other.passenger) {
        rows.push({
          id: other.id,
          bookingId: other.id,
          passengerId: other.passengerId,
          seats: other.seats,
          passenger: other.passenger,
        });
        continue;
      }
      rows.push({
        id: other.id,
        bookingId: other.id,
        passengerId: other.passengerId,
        seats: other.seats,
        displayName: resolvePersonDisplayName(other.passenger) || undefined,
      });
    }
  }

  if (publicRide) {
    pushArray(publicRide.coPassengers);
    pushArray(publicRide.passengers);
    pushArray(publicRide.bookedPassengers);
  }

  if (booking.ride && typeof booking.ride === 'object') {
    const rideRecord = booking.ride as Record<string, unknown>;
    pushArray(rideRecord.coPassengers);
    pushArray(rideRecord.passengers);
    pushArray(rideRecord.bookedPassengers);
    pushArray(rideRecord.fellowPassengers);
    pushArray(rideRecord.otherPassengers);
  }

  const bookingRecord = booking as BookingResponseDto & Record<string, unknown>;
  for (const [key, value] of Object.entries(bookingRecord)) {
    if (!Array.isArray(value)) {
      continue;
    }
    if (/passenger|co|fellow|booking/i.test(key)) {
      pushArray(value);
    }
  }

  return rows;
};

const CO_PASSENGER_ARRAY_KEYS = [
  'coPassengers',
  'fellowPassengers',
  'otherPassengers',
  'passengers',
  'bookedPassengers',
  'otherBookings',
] as const;

/** Temporary diagnostic — logs whether backend sent co-passenger arrays. */
export const logRiderCoPassengerApiDiagnostics = (
  booking: BookingResponseDto,
  publicRide?: RideSearchItemDto | null,
): void => {
  const bookingRecord = booking as BookingResponseDto & Record<string, unknown>;
  const rideRecord =
    booking.ride && typeof booking.ride === 'object'
      ? (booking.ride as Record<string, unknown>)
      : null;
  const publicRecord = publicRide as Record<string, unknown> | null | undefined;

  const arrayLengths = (record: Record<string, unknown> | null | undefined) => {
    if (!record) {
      return {};
    }
    const lengths: Record<string, number> = {};
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        lengths[key] = value.length;
      }
    }
    return lengths;
  };

  const hasCoPassengerArrays = CO_PASSENGER_ARRAY_KEYS.some((key) => {
    const bookingValue = bookingRecord[key];
    if (Array.isArray(bookingValue) && bookingValue.length > 0) {
      return true;
    }
    const rideValue = rideRecord?.[key];
    if (Array.isArray(rideValue) && rideValue.length > 0) {
      return true;
    }
    const publicValue = publicRecord?.[key];
    return Array.isArray(publicValue) && publicValue.length > 0;
  });

  console.log('[Rider co-passengers] API diagnostic', {
    bookingId: booking.id,
    rideId: booking.rideId,
    passengerId: booking.passengerId,
    hasCoPassengerArrays,
    bookingArrayLengths: arrayLengths(bookingRecord),
    rideArrayLengths: arrayLengths(rideRecord),
    publicRideArrayLengths: arrayLengths(publicRecord ?? null),
    bookingTopLevelKeys: Object.keys(bookingRecord),
    rideNestedKeys: rideRecord ? Object.keys(rideRecord) : null,
    publicRideTopLevelKeys: publicRecord ? Object.keys(publicRecord) : null,
    note: hasCoPassengerArrays
      ? 'Backend returned a co-passenger array — mapper should populate the list.'
      : 'Backend did NOT return coPassengers/passengers/otherBookings on GET /bookings/:id or GET /rides/public/:id. Add coPassengers[] to one of those responses.',
  });
};

/** Map other riders on the same trip (excludes the current passenger). */
export const mapCoPassengersFromBookingAndRide = (
  booking: BookingResponseDto,
  publicRide?: RideSearchItemDto | null,
): RiderCoPassenger[] => {
  const selfPassengerId = booking.passengerId?.trim();
  const selfBookingId = booking.id?.trim();
  const snapshots = collectCoPassengerSnapshots(booking, publicRide);
  const seen = new Set<string>();
  const passengers: RiderCoPassenger[] = [];

  for (const snapshot of snapshots) {
    const passengerId = asTrimmed(snapshot.passengerId);
    const bookingRowId = asTrimmed(snapshot.bookingId) || asTrimmed(snapshot.id);
    if (
      (selfPassengerId && passengerId && passengerId === selfPassengerId) ||
      (selfBookingId && bookingRowId && bookingRowId === selfBookingId)
    ) {
      continue;
    }

    const mapped = readPersonFromSnapshot(snapshot);
    if (!mapped) {
      continue;
    }

    const dedupeKey = passengerId || bookingRowId || mapped.id;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    passengers.push({
      id: dedupeKey,
      name: mapped.name,
      avatarUri: mapped.avatarUri || DEFAULT_PROFILE_AVATAR,
      seatsBooked: mapped.seatsBooked,
    });
  }

  logRiderCoPassengerApiDiagnostics(booking, publicRide);

  return passengers;
};

export const resolveRideSeatCounts = (
  booking: BookingResponseDto,
  publicRide?: RideSearchItemDto | null,
): { seatsTotal: number; seatsAvailable: number } => {
  const totalFromRide = publicRide?.totalSeats;
  const availableFromRide = publicRide?.availableSeats;
  if (
    typeof totalFromRide === 'number' &&
    Number.isFinite(totalFromRide) &&
    typeof availableFromRide === 'number' &&
    Number.isFinite(availableFromRide)
  ) {
    return {
      seatsTotal: Math.max(1, totalFromRide),
      seatsAvailable: Math.max(0, availableFromRide),
    };
  }

  const selfSeats = Math.max(0, Math.floor(Number(booking.seats) || 0));
  return {
    seatsTotal: Math.max(1, selfSeats),
    seatsAvailable: 0,
  };
};

const asTrimmed = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const formatCivilDateLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const isAssuredBooking = (booking: BookingResponseDto): boolean =>
  booking.bookingMode === 'ASSURED' || booking.ride?.rideType === 'ASSURED';

const isCommuteBooking = (booking: BookingResponseDto): boolean =>
  booking.bookingMode === 'COMMUTE' ||
  String(booking.ride?.rideType ?? '').trim().toUpperCase() === 'COMMUTE';

const resolveBookedRideType = (
  booking: BookingResponseDto,
): RiderBookedRideSummary['rideType'] => {
  if (isCommuteBooking(booking)) {
    return 'commute';
  }
  if (isAssuredBooking(booking)) {
    return 'assured';
  }
  return 'regular';
};

const resolveDriverPhone = (booking: BookingResponseDto): string | undefined =>
  resolveDriverContactPhone(booking) || undefined;

const otpFromBooking = (booking: BookingResponseDto): string => {
  const otp = booking.pickupOtp;
  if (typeof otp === 'string' && /^\d{4}$/.test(otp.trim())) {
    return otp.trim();
  }
  return '';
};

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

const formatSecurityDepositLabel = (booking: BookingResponseDto): string | undefined =>
  formatBookingSecurityDepositLabel(booking);

/** Map GET /bookings/:id → rider booked ride summary for the details screen. */
export const mapBookingToRiderBookedRideSummary = (
  booking: BookingResponseDto,
  publicRide?: RideSearchItemDto | null,
): RiderBookedRideSummary => {
  const ride = booking.ride;
  const datePart = ride?.departureDate ? formatCivilDateLabel(ride.departureDate) : '';
  const departureTimeLabel = ride?.departureTime
    ? formatApiDepartureTime(ride.departureTime)
    : '';
  const source = shortPlaceName(ride?.source ?? '') || 'Pickup';
  const destination = shortPlaceName(ride?.destination ?? '') || 'Drop-off';
  const vehicleLabel = resolveBookingVehicleLabel(booking.vehicle);
  const plate = resolveBookingVehiclePlate(booking.vehicle);
  const vehicleWithPlate =
    vehicleLabel && plate ? `${vehicleLabel} · ${plate}` : vehicleLabel || plate;
  const { seatsTotal, seatsAvailable } = resolveRideSeatCounts(booking, publicRide);
  const preferenceSource = publicRide ?? booking.ride ?? null;

  return {
    bookingId: booking.id,
    rideId: booking.rideId,
    listingId: booking.id.slice(0, 8).toUpperCase(),
    rideType: resolveBookedRideType(booking),
    routeTitle: `${source} → ${destination}`,
    source,
    destination,
    dateLabel: [datePart, departureTimeLabel].filter(Boolean).join(', '),
    departureTimeLabel,
    vehicleLabel: vehicleWithPlate,
    seatsBooked: Math.max(0, Math.floor(Number(booking.seats) || 0)),
    fareTotal: parsePricePerSeat(String(booking.totalAmount ?? '0')),
    paymentStatus: formatPassengerPaymentStatusLabel({
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      rideStatus: booking.ride?.status,
    }),
    paymentMethodLabel: formatPaymentMethodLabel(String(booking.paymentMethod ?? '')),
    bookingStatus: String(booking.status ?? '').trim().toUpperCase(),
    pickupStatus: String(booking.pickupStatus ?? '').trim().toUpperCase() || undefined,
    rideStatus: String(booking.ride?.status ?? '').trim().toUpperCase() || undefined,
    securityDepositLabel: isAssuredBooking(booking)
      ? formatSecurityDepositLabel(booking)
      : undefined,
    pickupOtp: shouldShowPickupOtp(booking) ? otpFromBooking(booking) : undefined,
    pickup: null,
    dropoff: null,
    seatsTotal,
    seatsAvailable,
    preferences: mapRideSourceToPreferenceRules(preferenceSource),
    womenOnly: resolveWomenOnly(preferenceSource),
  };
};

/** Map booking driver snapshot → card row (reuses driver track passenger card UI). */
export const mapBookingToRiderBookedDriverCard = (
  booking: BookingResponseDto,
  publicRide?: RideSearchItemDto | null,
): DriverTrackConfirmedPassenger => {
  const name = resolvePersonDisplayName(booking.driver) || 'Driver';
  const vehicleLabel = resolveBookingVehicleLabel(booking.vehicle);
  const plate = resolveBookingVehiclePlate(booking.vehicle);
  const subtitle = [vehicleLabel, plate].filter(Boolean).join(' · ');
  const phone = resolveDriverPhone(booking);

  if (!phone) {
    console.log('[Ride Details] driver phone missing on booking', {
      bookingId: booking.id,
      rideId: booking.rideId,
      driverKeys: contactSnapshotKeys(booking.driver),
    });
  }

  if (!resolvePersonDisplayName(booking.driver)) {
    console.log('[Rider booked ride] driver name missing on booking', {
      bookingId: booking.id,
      rideId: booking.rideId,
      driverKeys:
        booking.driver && typeof booking.driver === 'object'
          ? Object.keys(booking.driver)
          : null,
      driver: booking.driver ?? null,
    });
  }

  if (!vehicleLabel || vehicleLabel === 'Vehicle') {
    console.log('[Rider booked ride] vehicle snapshot missing on booking', {
      bookingId: booking.id,
      rideId: booking.rideId,
      vehicle: booking.vehicle ?? null,
    });
  }

  return {
    id: booking.driver?.id?.trim() || booking.rideId,
    name,
    subtitle,
    verified: booking.driver?.verified === true,
    avatarUri:
      resolveDriverPhotoUrl(booking.driver, publicRide?.driver) || DEFAULT_PROFILE_AVATAR,
    seatsBooked: Math.max(0, Math.floor(Number(booking.seats) || 0)),
    bookingStatus: String(booking.status ?? '').trim().toUpperCase(),
    paymentStatus: formatPassengerPaymentStatusLabel({
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      rideStatus: booking.ride?.status,
    }),
    paymentMethodLabel: formatPaymentMethodLabel(String(booking.paymentMethod ?? '')),
    fareTotal: parsePricePerSeat(String(booking.totalAmount ?? '0')) || undefined,
    phone,
    callAvailable: Boolean(phone),
    chatAvailable: true,
  };
};
