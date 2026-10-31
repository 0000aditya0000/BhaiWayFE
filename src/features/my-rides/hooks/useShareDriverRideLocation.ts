import { useEffect, useSyncExternalStore } from 'react';

import { driverLocationPublisher } from '@/services/location';
import type { MapLatLng } from '@/shared/maps';

export interface UseShareDriverRideLocationOptions {
  rideId: string;
  /** When false, this screen stops requesting tracking — it does not stop the app publisher. */
  enabled: boolean;
  /**
   * When true (default), publish only while backend ride.status is IN_PROGRESS.
   * Kept for call-site compatibility; eligibility is enforced by the publisher.
   */
  isRegular?: boolean;
}

export interface UseShareDriverRideLocationResult {
  coordinate: MapLatLng | null;
  heading: number | null;
  speed: number | null;
  locationErrorMessage: string | null;
  rideInProgress: boolean;
  backgroundGranted: boolean;
  backgroundConsentRequired: boolean;
  hasAffirmativeConsent: boolean;
  openLocationSettings: () => void;
}

const subscribe = (onStoreChange: () => void): (() => void) =>
  driverLocationPublisher.subscribe(onStoreChange);

const getSnapshot = () => driverLocationPublisher.getSnapshot();

/**
 * Subscribe this screen to the app-level driver location publisher.
 * GPS watch, socket emit, and REST posts are owned by `driverLocationPublisher`
 * so navigating away from Pickup / Active Trip does not stop rider map updates.
 */
export const useShareDriverRideLocation = (
  options: UseShareDriverRideLocationOptions,
): UseShareDriverRideLocationResult => {
  const rideId = options.rideId.trim();
  const enabled = options.enabled && Boolean(rideId);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void driverLocationPublisher.ensure(rideId);
  }, [enabled, rideId]);

  const sameRide = snapshot.rideId === rideId;

  return {
    coordinate: sameRide ? snapshot.coordinate : null,
    heading: sameRide ? snapshot.heading : null,
    speed: sameRide ? snapshot.speed : null,
    locationErrorMessage: sameRide ? snapshot.errorMessage : null,
    rideInProgress: sameRide ? snapshot.rideInProgress : false,
    backgroundGranted: sameRide ? snapshot.backgroundGranted : false,
    backgroundConsentRequired: sameRide ? Boolean(snapshot.backgroundConsentRequired) : false,
    hasAffirmativeConsent: sameRide ? Boolean(snapshot.hasAffirmativeConsent) : false,
    openLocationSettings: driverLocationPublisher.openSettings,
  };
};
