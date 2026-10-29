import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getDriverChatPath } from '@/features/ride-search/constants';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { getRiderProfileMock } from '../constants';
import type { RiderProfileSummary } from '../types';

export interface UseRiderProfileResult {
  profile: RiderProfileSummary;
  goBack: () => void;
  messageRider: () => void;
}

export const useRiderProfile = (): UseRiderProfileResult => {
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
    verified?: string;
  }>();

  const profile = useMemo(() => {
    const rating = Number(getSearchParam(params.rating));
    const ridesCount = Number(getSearchParam(params.ridesCount));
    const seatsBooked = Number(getSearchParam(params.seatsBooked));
    const verifiedParam = getSearchParam(params.verified);

    return getRiderProfileMock({
      rideId: getSearchParam(params.rideId) || undefined,
      riderId: getSearchParam(params.riderId) || undefined,
      name: getSearchParam(params.name) || undefined,
      subtitle: getSearchParam(params.subtitle) || undefined,
      avatarUri: getSearchParam(params.avatarUri) || undefined,
      rating: Number.isFinite(rating) ? rating : undefined,
      ridesCount: Number.isFinite(ridesCount) ? ridesCount : undefined,
      seatsBooked: Number.isFinite(seatsBooked) ? seatsBooked : undefined,
      verified: verifiedParam === '0' ? false : true,
    });
  }, [params]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const messageRider = useCallback(() => {
    triggerLightHaptic();
    router.push(
      getDriverChatPath({
        driverName: profile.name,
        carModel: `${profile.jobTitle} @ ${profile.company}`,
        bookingId: profile.riderId,
        threadId: profile.riderId,
        perspective: 'driver',
        avatarUri: profile.avatarUri,
      }),
    );
  }, [profile, router]);

  return {
    profile,
    goBack,
    messageRider,
  };
};
