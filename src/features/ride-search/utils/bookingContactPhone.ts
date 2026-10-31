import type { BookingResponseDto } from '../api/bookings.types';

type LooseRecord = Record<string, unknown>;

const PHONE_KEYS = [
  'phone',
  'phoneNumber',
  'mobile',
  'mobileNumber',
  'contactPhone',
  'contactNumber',
  'phoneNo',
] as const;

const NESTED_PERSON_KEYS = ['user', 'contact', 'profile', 'rider', 'passenger', 'driver'] as const;

const asRecord = (value: unknown): LooseRecord | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as LooseRecord;
  }
  return null;
};

const asTrimmed = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const readDirectPhone = (record: LooseRecord | null): string => {
  if (!record) {
    return '';
  }
  for (const key of PHONE_KEYS) {
    const value = asTrimmed(record[key]);
    if (value) {
      return value;
    }
  }
  return '';
};

/** Phone from a driver/passenger snapshot. Empty when the backend omitted contact. */
export const resolveContactSnapshotPhone = (person: unknown): string => {
  const root = asRecord(person);
  if (!root) {
    return '';
  }
  const direct = readDirectPhone(root);
  if (direct) {
    return direct;
  }
  for (const key of NESTED_PERSON_KEYS) {
    const nested = readDirectPhone(asRecord(root[key]));
    if (nested) {
      return nested;
    }
  }
  return '';
};

export const resolveDriverContactPhone = (booking: BookingResponseDto): string => {
  const record = booking as BookingResponseDto & LooseRecord;
  return (
    resolveContactSnapshotPhone(booking.driver) || asTrimmed(record.driverPhone)
  );
};

export const resolvePassengerContactPhone = (booking: BookingResponseDto): string => {
  const record = booking as BookingResponseDto & LooseRecord;
  return (
    resolveContactSnapshotPhone(booking.passenger) ||
    resolveContactSnapshotPhone(record.rider) ||
    asTrimmed(record.passengerPhone) ||
    asTrimmed(record.riderPhone)
  );
};

export const resolveRidePeerContactPhone = (
  booking: BookingResponseDto,
  perspective: 'driver' | 'rider',
): string =>
  perspective === 'driver'
    ? resolvePassengerContactPhone(booking)
    : resolveDriverContactPhone(booking);

export const contactSnapshotKeys = (person: unknown): string[] | null => {
  const record = asRecord(person);
  return record ? Object.keys(record) : null;
};
