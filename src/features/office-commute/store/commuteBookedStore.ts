import type { BookingResponseDto } from '@/features/ride-search/api/bookings.types';

export type CommuteBookedSnapshot = {
  booking: BookingResponseDto;
  rideId: string;
};

let snapshot: CommuteBookedSnapshot | null = null;
const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

/** Last Commute POST /bookings response — display only; backend is source of truth. */
export const commuteBookedStore = {
  get: (): CommuteBookedSnapshot | null => snapshot,

  set: (value: CommuteBookedSnapshot): void => {
    snapshot = value;
    emit();
  },

  clear: (): void => {
    snapshot = null;
    emit();
  },

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
