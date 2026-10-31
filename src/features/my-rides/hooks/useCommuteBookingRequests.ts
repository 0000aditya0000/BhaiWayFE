import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { listMyRides, type RideResponseDto } from '@/features/offer-ride/api';
import { listDriverBookings } from '@/features/ride-search/api';
import { getErrorMessage } from '@/shared/utils';

import { COMMUTE_BOOKING_REQUESTS_SCREEN } from '../constants/commute-booking-requests.constants';
import { getDriverTrackRidePath } from '../constants/driver-track-ride.constants';
import type { CommutePendingRequestGroup, DriverTrackPendingRequest } from '../types';
import { groupPendingCommuteBookingsByRide } from '../utils';
import { useCommuteBookingRequestActions } from './useCommuteBookingRequestActions';

export interface UseCommuteBookingRequestsResult {
  groups: readonly CommutePendingRequestGroup[];
  totalPendingCount: number;
  loading: boolean;
  refreshing: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  goBack: () => void;
  openRideDetails: (rideId: string) => void;
  acceptRequest: (request: DriverTrackPendingRequest) => void;
  declineRequest: (request: DriverTrackPendingRequest) => void;
  isAccepting: (bookingId: string) => boolean;
  isRejecting: (bookingId: string) => boolean;
}

const buildRideMeta = (rides: readonly RideResponseDto[]) => {
  const meta: Record<
    string,
    {
      source?: string | null;
      destination?: string | null;
      departureDate?: string | null;
      departureTime?: string | null;
      availableSeats?: number | null;
      totalSeats?: number | null;
    }
  > = {};
  for (const ride of rides) {
    meta[ride.id] = {
      source: ride.source,
      destination: ride.destination,
      departureDate: ride.departureDate,
      departureTime: ride.departureTime,
      availableSeats: ride.availableSeats,
      totalSeats: ride.totalSeats,
    };
  }
  return meta;
};

export const useCommuteBookingRequests = (): UseCommuteBookingRequestsResult => {
  const router = useRouter();
  const [groups, setGroups] = useState<CommutePendingRequestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setErrorMessage(null);
    try {
      const [driverBookings, rides] = await Promise.all([
        listDriverBookings({ page: 1, limit: 100 }),
        listMyRides(),
      ]);
      const commuteRides = rides.filter(
        (ride) => String(ride.rideType ?? '').trim().toUpperCase() === 'COMMUTE',
      );
      setGroups(
        groupPendingCommuteBookingsByRide(driverBookings, buildRideMeta(commuteRides)),
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, COMMUTE_BOOKING_REQUESTS_SCREEN.errorTitle),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const {
    acceptRequest,
    declineRequest,
    isAccepting,
    isRejecting,
  } = useCommuteBookingRequestActions({
    onAfterMutation: () => load({ silent: true }),
  });

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
  }, [load]);

  const totalPendingCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.requests.length, 0),
    [groups],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/my-rides');
  }, [router]);

  const openRideDetails = useCallback(
    (rideId: string) => {
      router.push(getDriverTrackRidePath(rideId));
    },
    [router],
  );

  return {
    groups,
    totalPendingCount,
    loading,
    refreshing,
    errorMessage,
    refresh,
    goBack,
    openRideDetails,
    acceptRequest,
    declineRequest,
    isAccepting,
    isRejecting,
  };
};
