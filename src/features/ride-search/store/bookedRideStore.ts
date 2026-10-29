import type { BookingResponseDto } from '../api/bookings.types';
import type { BookedRideDetails } from '../types';

type Listener = (value: BookedRideSnapshot | null) => void;

export interface BookedRideSnapshot {
  booking: BookingResponseDto;
  details: BookedRideDetails;
}

let current: BookedRideSnapshot | null = null;
const listeners = new Set<Listener>();

export const bookedRideStore = {
  get: (): BookedRideSnapshot | null => current,
  set: (value: BookedRideSnapshot) => {
    current = value;
    listeners.forEach((listener) => listener(current));
  },
  clear: () => {
    current = null;
    listeners.forEach((listener) => listener(null));
  },
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
