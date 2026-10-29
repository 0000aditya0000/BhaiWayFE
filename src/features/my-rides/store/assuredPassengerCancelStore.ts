import type { CancelBookingResultDto } from '@/features/ride-search/api/bookings.types';

import type { AssuredPassengerCancelDisplay } from '../utils/mapAssuredPassengerCancelResult';
import { mapAssuredPassengerCancelDisplay } from '../utils/mapAssuredPassengerCancelResult';

export type AssuredPassengerCancelSnapshot = {
  result: CancelBookingResultDto;
  display: AssuredPassengerCancelDisplay;
};

let snapshot: AssuredPassengerCancelSnapshot | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const assuredPassengerCancelStore = {
  get: (): AssuredPassengerCancelSnapshot | null => snapshot,

  setResult: (result: CancelBookingResultDto): AssuredPassengerCancelSnapshot => {
    snapshot = {
      result,
      display: mapAssuredPassengerCancelDisplay(result),
    };
    emit();
    return snapshot;
  },

  clear: (): void => {
    snapshot = null;
    emit();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
