import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getSearchParam, showAppAlert, triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { getDriverChatPath } from '@/features/ride-search/constants';
import {
  DEFAULT_DRIVER_TRACK_RIDE,
  DEFAULT_PENDING_REQUESTS,
  DRIVER_TRACK_RIDE_SCREEN,
  getDeclineRiderPath,
  getRiderProfilePath,
  getRiderRequestAcceptedPath,
} from '../constants';
import { regularRideRidersStore } from '../store';
import type {
  DriverTrackConfirmedPassenger,
  DriverTrackPendingRequest,
  DriverTrackRideSummary,
  UpcomingRideRider,
} from '../types';

export interface UseDriverTrackRideResult {
  ride: DriverTrackRideSummary;
  confirmed: readonly DriverTrackConfirmedPassenger[];
  pending: readonly DriverTrackPendingRequest[];
  fillPercent: number;
  goBack: () => void;
  callPassenger: (name: string) => void;
  chatPassenger: (passenger: {
    id: string;
    name: string;
    avatarUri?: string;
  }) => void;
  openRiderProfile: (passenger: {
    id: string;
    name: string;
    subtitle?: string;
    avatarUri?: string;
    rating?: number;
    ridesCount?: number;
    seatsBooked?: number;
    verified?: boolean;
  }) => void;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
}

const toConfirmed = (rider: UpcomingRideRider): DriverTrackConfirmedPassenger => ({
  id: rider.id,
  name: rider.name,
  subtitle: rider.subtitle ?? '',
  verified: rider.verified,
  avatarUri: rider.avatarUri,
  seatsBooked: rider.seatsBooked,
});

export const useDriverTrackRide = (): UseDriverTrackRideResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = getSearchParam(params.rideId) || DEFAULT_DRIVER_TRACK_RIDE.rideId;

  const baseRide = useMemo(
    () =>
      rideId === DEFAULT_DRIVER_TRACK_RIDE.rideId
        ? DEFAULT_DRIVER_TRACK_RIDE
        : { ...DEFAULT_DRIVER_TRACK_RIDE, rideId },
    [rideId],
  );

  const [confirmedRiders, setConfirmedRiders] = useState<readonly UpcomingRideRider[]>(() =>
    regularRideRidersStore.getForRide(rideId),
  );

  const filterPending = useCallback((): DriverTrackPendingRequest[] => {
    const acceptedIds = new Set(regularRideRidersStore.getForRide(rideId).map((r) => r.id));
    const declinedIds = regularRideRidersStore.getDeclinedIds(rideId);
    return DEFAULT_PENDING_REQUESTS.filter(
      (item) => !acceptedIds.has(item.id) && !declinedIds.has(item.id),
    );
  }, [rideId]);

  const [pending, setPending] = useState<DriverTrackPendingRequest[]>(() => filterPending());

  useEffect(
    () =>
      regularRideRidersStore.subscribe(() => {
        setConfirmedRiders(regularRideRidersStore.getForRide(rideId));
        setPending(filterPending());
      }),
    [filterPending, rideId],
  );

  const confirmed = useMemo(
    () => confirmedRiders.map(toConfirmed),
    [confirmedRiders],
  );

  const seatsConfirmed = useMemo(
    () => confirmed.reduce((sum, item) => sum + item.seatsBooked, 0),
    [confirmed],
  );

  const fillPercent = useMemo(() => {
    if (baseRide.seatsTotal <= 0) {
      return 0;
    }
    return Math.round((seatsConfirmed / baseRide.seatsTotal) * 100);
  }, [baseRide.seatsTotal, seatsConfirmed]);

  const ride: DriverTrackRideSummary = {
    ...baseRide,
    seatsConfirmed,
    confirmed,
    pending,
  };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const callPassenger = useCallback((name: string) => {
    triggerLightHaptic();
    showAppAlert(
      DRIVER_TRACK_RIDE_SCREEN.callAlertTitle,
      DRIVER_TRACK_RIDE_SCREEN.callAlertMessage(name),
    );
  }, []);

  const chatPassenger = useCallback(
    (passenger: { id: string; name: string; avatarUri?: string }) => {
      triggerLightHaptic();
      router.push(
        getDriverChatPath({
          driverName: passenger.name,
          carModel: 'Confirmed rider',
          threadId: `driver-${rideId}-${passenger.id}`,
          perspective: 'driver',
          routeLabel: ride.routeTitle,
          tripTimeLabel: ride.dateLabel,
          avatarUri: passenger.avatarUri,
        }),
      );
    },
    [ride.dateLabel, ride.routeTitle, rideId, router],
  );

  const openRiderProfile = useCallback(
    (passenger: {
      id: string;
      name: string;
      subtitle?: string;
      avatarUri?: string;
      rating?: number;
      ridesCount?: number;
      seatsBooked?: number;
      verified?: boolean;
    }) => {
      triggerLightHaptic();
      router.push(
        getRiderProfilePath({
          rideId,
          riderId: passenger.id,
          name: passenger.name,
          subtitle: passenger.subtitle,
          avatarUri: passenger.avatarUri,
          rating: passenger.rating,
          ridesCount: passenger.ridesCount,
          seatsBooked: passenger.seatsBooked,
          verified: passenger.verified,
        }),
      );
    },
    [rideId, router],
  );

  const acceptRequest = useCallback(
    (id: string) => {
      const request = pending.find((item) => item.id === id);
      if (!request) {
        return;
      }
      triggerSuccessHaptic();
      regularRideRidersStore.accept(rideId, {
        id: request.id,
        name: request.name,
        subtitle: request.subtitle,
        seatsBooked: request.seatsBooked,
        verified: request.idVerified,
        avatarUri: request.avatarUri,
      });
      setPending((prev) => prev.filter((item) => item.id !== id));
      router.push(
        getRiderRequestAcceptedPath({
          rideId,
          riderId: request.id,
          name: request.name,
          subtitle: request.subtitle,
          avatarUri: request.avatarUri,
          rating: request.rating,
          ridesCount: request.ridesCount,
          seatsBooked: request.seatsBooked,
        }),
      );
    },
    [pending, rideId, router],
  );

  const declineRequest = useCallback(
    (id: string) => {
      const request = pending.find((item) => item.id === id);
      if (!request) {
        return;
      }
      triggerLightHaptic();
      router.push(
        getDeclineRiderPath({
          rideId,
          riderId: request.id,
          name: request.name,
        }),
      );
    },
    [pending, rideId, router],
  );

  return {
    ride,
    confirmed,
    pending,
    fillPercent,
    goBack,
    callPassenger,
    chatPassenger,
    openRiderProfile,
    acceptRequest,
    declineRequest,
  };
};
