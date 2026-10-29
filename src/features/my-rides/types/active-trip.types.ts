import type { MapLatLng } from '@/shared/maps';

export interface ActiveTripPassenger {
  id: string;
  name: string;
  avatarUri: string;
  isOnline: boolean;
}

export interface ActiveTripNavStep {
  instruction: string;
  distanceLabel: string;
  icon: 'arrow-forward' | 'return-up-forward' | 'return-down-back';
}

export interface ActiveTripSummary {
  destinationLabel: string;
  /** Null when ETA cannot be derived from real GPS + destination coords. */
  etaMinutes: number | null;
  /** Human-readable ETA such as `7 hr 18 min`. */
  etaLabel: string;
  distanceLabel: string;
  progress: number;
  /** Assured/demo static map only. */
  mapImageUri?: string;
  destinationCoordinate: MapLatLng | null;
  routeCoordinates: MapLatLng[];
  locationErrorMessage: string | null;
  navStep: ActiveTripNavStep;
  passengers: readonly ActiveTripPassenger[];
}
