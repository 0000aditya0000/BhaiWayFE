import type { WeekdayId } from '../types';

export interface PublishedCommuteSummary {
  pickupLabel: string;
  dropoffLabel: string;
  departureLabel: string;
  seats: number;
  pricePerSeat: string;
  recurringDays: WeekdayId[];
  rideId?: string;
  seriesId?: string | null;
  occurrenceSummary?: string;
  outboundCount?: number;
  returnCount?: number;
}

type Listener = (summary: PublishedCommuteSummary | null) => void;

let summary: PublishedCommuteSummary | null = null;
const listeners = new Set<Listener>();

const notify = (): void => {
  listeners.forEach((listener) => listener(summary ? { ...summary } : null));
};

export const publishedCommuteStore = {
  get: (): PublishedCommuteSummary | null => (summary ? { ...summary } : null),

  set: (next: PublishedCommuteSummary): void => {
    summary = { ...next, recurringDays: [...next.recurringDays] };
    notify();
  },

  clear: (): void => {
    summary = null;
    notify();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    listener(summary ? { ...summary } : null);
    return () => {
      listeners.delete(listener);
    };
  },
};
