import type { BookingResponseDto } from '../api/bookings.types';

type ContactSnapshot = {
  phone?: string | null;
  phoneNumber?: string | null;
  mobile?: string | null;
} | null | undefined;

const asTrimmed = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/** Phone from a driver/passenger snapshot. Empty when the backend omitted contact. */
export const resolveContactSnapshotPhone = (person: ContactSnapshot): string =>
  asTrimmed(person?.phone) || asTrimmed(person?.phoneNumber) || asTrimmed(person?.mobile);

export const resolveDriverContactPhone = (booking: BookingResponseDto): string =>
  resolveContactSnapshotPhone(booking.driver);

export const resolvePassengerContactPhone = (booking: BookingResponseDto): string =>
  resolveContactSnapshotPhone(booking.passenger);

export const resolveRidePeerContactPhone = (
  booking: BookingResponseDto,
  perspective: 'driver' | 'rider',
): string =>
  perspective === 'driver'
    ? resolvePassengerContactPhone(booking)
    : resolveDriverContactPhone(booking);
