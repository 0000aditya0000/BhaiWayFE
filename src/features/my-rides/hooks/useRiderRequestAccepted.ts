import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  DRIVER_CHAT_SCREEN,
  getDriverChatPath,
} from '@/features/ride-search/constants';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { getRiderProfilePath } from '../constants';

export interface RiderAcceptedSummary {
  rideId: string;
  riderId: string;
  name: string;
  subtitle: string;
  avatarUri: string;
  rating: number;
  ridesCount: number;
  seatsBooked: number;
}

export interface UseRiderRequestAcceptedResult {
  rider: RiderAcceptedSummary;
  goToDashboard: () => void;
  messageRider: () => void;
  openRiderProfile: () => void;
  goBack: () => void;
}

export const useRiderRequestAccepted = (): UseRiderRequestAcceptedResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    riderId?: string;
    name?: string;
    subtitle?: string;
    avatarUri?: string;
    rating?: string;
    ridesCount?: string;
    seatsBooked?: string;
  }>();

  const rider = useMemo((): RiderAcceptedSummary => {
    const rating = Number(getSearchParam(params.rating));
    const ridesCount = Number(getSearchParam(params.ridesCount));
    const seatsBooked = Number(getSearchParam(params.seatsBooked));
    return {
      rideId: getSearchParam(params.rideId) || 'driving-upcoming-regular-1',
      riderId: getSearchParam(params.riderId) || 'pending-rohan',
      name: getSearchParam(params.name) || 'Rohan M.',
      subtitle: getSearchParam(params.subtitle) || 'Senior Engineer @ Google',
      avatarUri: getSearchParam(params.avatarUri) || '',
      rating: Number.isFinite(rating) ? rating : 4.7,
      ridesCount: Number.isFinite(ridesCount) ? ridesCount : 124,
      seatsBooked: Number.isFinite(seatsBooked) ? seatsBooked : 1,
    };
  }, [params]);

  const goToDashboard = useCallback(() => {
    triggerLightHaptic();
    router.replace(ROUTES.myRides);
  }, [router]);

  const messageRider = useCallback(() => {
    triggerLightHaptic();
    router.push(
      getDriverChatPath({
        driverName: rider.name,
        carModel: rider.subtitle || `${rider.seatsBooked} seat(s)`,
        bookingId: rider.riderId,
        threadId: rider.riderId,
        perspective: 'driver',
        routeLabel: DRIVER_CHAT_SCREEN.defaultRouteLabel,
        tripTimeLabel: DRIVER_CHAT_SCREEN.defaultTripTimeLabel,
        avatarUri: rider.avatarUri,
      }),
    );
  }, [rider.avatarUri, rider.name, rider.riderId, rider.seatsBooked, rider.subtitle, router]);

  const openRiderProfile = useCallback(() => {
    triggerLightHaptic();
    router.push(
      getRiderProfilePath({
        rideId: rider.rideId,
        riderId: rider.riderId,
        name: rider.name,
        subtitle: rider.subtitle,
        avatarUri: rider.avatarUri,
        rating: rider.rating,
        ridesCount: rider.ridesCount,
        seatsBooked: rider.seatsBooked,
        verified: true,
      }),
    );
  }, [rider, router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  return {
    rider,
    goToDashboard,
    messageRider,
    openRiderProfile,
    goBack,
  };
};
