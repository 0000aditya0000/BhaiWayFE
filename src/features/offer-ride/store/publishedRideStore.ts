import type {
  OutstationRideTypeId,
  PublishRidePreferences,
  PublishRideVehicleOption,
} from '../types';

export interface PublishedRideSummary {
  /** Real backend ride UUID after POST /rides. */
  rideId?: string;
  /** Authoritative backend lifecycle status (e.g. ASSURANCE_ACTIVE). */
  backendStatus?: string;
  /** Passenger bookability from backend — not a lifecycle label. */
  isBookable?: boolean;
  /** User-facing status label derived from backendStatus. */
  statusLabel?: string;
  pickupLabel: string;
  dropoffLabel: string;
  departureLabel: string;
  seats: number;
  pricePerSeat: string;
  rideType: OutstationRideTypeId;
  vehicle: PublishRideVehicleOption | null;
  preferences: PublishRidePreferences;
  notes: string;
  /** Assured rides only — shown on success screen. */
  refundableAmount: string | null;
}

type Listener = (summary: PublishedRideSummary | null) => void;

let summary: PublishedRideSummary | null = null;
const listeners = new Set<Listener>();

const notify = (): void => {
  listeners.forEach((listener) => listener(summary ? { ...summary } : null));
};

export const publishedRideStore = {
  get: (): PublishedRideSummary | null => (summary ? { ...summary } : null),

  set: (next: PublishedRideSummary): void => {
    summary = {
      ...next,
      preferences: { ...next.preferences },
      vehicle: next.vehicle ? { ...next.vehicle } : null,
    };
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
