import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  rideBookingsSheetStore,
  type RideBookingsSheetRow,
} from '@/DemoData';
import { listMyRides, type RideResponseDto } from '@/features/offer-ride/api';
import { useGetBookingsQuery } from '@/services/api';
import { useSessionUser } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/utils';
import { appModeStore, authSession, type AppMode } from '@/store';
import {
  DEFAULT_PROFILE_AVATAR,
  getCancelUpcomingRidePath,
  getDriverTrackRidePath,
  getDriverPickupPath,
  getModifyRidePath,
  getRideInvoicePath,
  getTripDetailsPath,
  MY_RIDES_SCREEN,
} from '../constants';
import {
  isHistoryRideStatus,
  isUpcomingRideStatus,
  mapBookingToUpcoming,
  mapRideResponseToHistory,
  mapRideResponseToUpcoming,
  rideKindFromAssuredFlag,
} from '../utils';
import {
  myRidesSurfaceStore,
  type MyRidesSurface,
  upcomingRideCancelledStore,
  regularRideRidersStore,
} from '../store';
import type {
  HistoryRideItem,
  MyRidesRideRole,
  MyRidesTab,
  UpcomingRideSummary,
} from '../types';

export interface UseMyRidesResult {
  mode: AppMode;
  surface: MyRidesSurface;
  showModeBadge: boolean;
  modeBadge: string;
  tab: MyRidesTab;
  setTab: (tab: MyRidesTab) => void;
  avatarUri: string | null;
  upcomingRides: readonly UpcomingRideSummary[];
  historyRides: readonly HistoryRideItem[];
  cancelLabel: string;
  modifyLabel: string;
  trackLabel: string;
  peerLabel: string;
  emptyUpcomingSubtitle: string;
  emptyPastSubtitle: string;
  resolveRideRole: (ride: UpcomingRideSummary) => MyRidesRideRole;
  labelsForRole: (role: MyRidesRideRole) => {
    peerLabel: string;
    cancelLabel: string;
    trackLabel: string;
  };
  openProfile: () => void;
  openNotifications: () => void;
  openRideDetails: (ride: UpcomingRideSummary) => void;
  openPastRide: (ride: HistoryRideItem) => void;
  modifyRide: (ride: UpcomingRideSummary) => void;
  trackRide: (ride: UpcomingRideSummary) => void;
  cancelRequest: (ride: UpcomingRideSummary) => void;
}

export const useMyRides = (): UseMyRidesResult => {
  const router = useRouter();
  const user = useSessionUser();
  const [tab, setTab] = useState<MyRidesTab>('upcoming');
  const [mode, setMode] = useState<AppMode>(() => appModeStore.get());
  const [surface, setSurface] = useState<MyRidesSurface>(() => myRidesSurfaceStore.get());
  const [upcomingCancelled, setUpcomingCancelled] = useState(() =>
    upcomingRideCancelledStore.get(),
  );
  const [regularRidersVersion, setRegularRidersVersion] = useState(0);
  const [myDriverRides, setMyDriverRides] = useState<RideResponseDto[]>([]);
  const [bookings, setBookings] = useState<RideBookingsSheetRow[]>(() =>
    rideBookingsSheetStore.getForCurrentUser(),
  );

  const { data: bookingsQueryData } = useGetBookingsQuery({ mine: true });

  useEffect(() => {
    if (bookingsQueryData?.bookings) {
      setBookings(bookingsQueryData.bookings);
    }
  }, [bookingsQueryData]);

  useEffect(() => appModeStore.subscribe(setMode), []);
  useEffect(() => myRidesSurfaceStore.subscribe(setSurface), []);
  useEffect(() => upcomingRideCancelledStore.subscribe(setUpcomingCancelled), []);
  useEffect(
    () =>
      regularRideRidersStore.subscribe(() => {
        setRegularRidersVersion((value) => value + 1);
      }),
    [],
  );
  useEffect(
    () =>
      rideBookingsSheetStore.subscribe(() => {
        setBookings(rideBookingsSheetStore.getForCurrentUser());
      }),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        if (!authSession.getToken()) {
          return;
        }
        try {
          const rows = await listMyRides();
          if (active) {
            setMyDriverRides(rows);
          }
        } catch (error) {
          console.log('[My Rides] GET /rides/my failed', getErrorMessage(error));
          if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            Number((error as { status?: unknown }).status) === 401
          ) {
            authSession.clear();
            router.replace(ROUTES.welcome);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, [router]),
  );

  const isDriving = mode === 'driving';
  const isOfficeCommute = surface === 'office-commute';
  const showModeBadge = !isOfficeCommute;

  const upcomingRides = useMemo((): readonly UpcomingRideSummary[] => {
    if (upcomingCancelled) {
      return [];
    }

    if (isDriving) {
      return myDriverRides
        .filter((row) => isUpcomingRideStatus(row.status))
        .map((row) => {
          const mapped = mapRideResponseToUpcoming(row);
          return {
            ...mapped,
            riders: regularRideRidersStore.getForRide(mapped.id),
          };
        });
    }

    return bookings
      .filter((row) => row.status === 'confirmed')
      .map(mapBookingToUpcoming);
  }, [
    bookings,
    isDriving,
    myDriverRides,
    upcomingCancelled,
    regularRidersVersion,
  ]);

  const historyRides = useMemo((): readonly HistoryRideItem[] => {
    if (isDriving) {
      return myDriverRides
        .filter((row) => isHistoryRideStatus(row.status))
        .map(mapRideResponseToHistory);
    }

    return bookings
      .filter((row) => row.status === 'completed' || row.status === 'cancelled')
      .map((row) => {
        const upcoming = mapBookingToUpcoming(row);
        return {
          id: upcoming.id,
          title: row.status === 'cancelled' ? 'Ride Cancelled' : 'Trip Completed',
          routeLabel: `${upcoming.pickupLabel} → ${upcoming.dropoffLabel}`,
          dateLabel: upcoming.dateLabel,
          statusLabel: row.status === 'cancelled' ? 'Cancelled' : 'Completed',
          pickupLabel: upcoming.pickupLabel,
          dropoffLabel: upcoming.dropoffLabel,
          pickup: upcoming.pickup,
          dropoff: upcoming.dropoff,
          role: 'rider' as const,
        };
      });
  }, [bookings, isDriving, myDriverRides]);

  const resolveRideRole = useCallback(
    (ride: UpcomingRideSummary): MyRidesRideRole => {
      if (ride.role) {
        return ride.role;
      }
      return isDriving ? 'driver' : 'rider';
    },
    [isDriving],
  );

  const labelsForRole = useCallback((role: MyRidesRideRole) => {
    if (role === 'driver') {
      return {
        peerLabel: MY_RIDES_SCREEN.peerLabelDriving,
        cancelLabel: MY_RIDES_SCREEN.cancelLabelDriving,
        trackLabel: MY_RIDES_SCREEN.trackLabelDriving,
      };
    }
    return {
      peerLabel: MY_RIDES_SCREEN.peerLabelRiding,
      cancelLabel: MY_RIDES_SCREEN.cancelLabelRiding,
      trackLabel: MY_RIDES_SCREEN.trackLabelRiding,
    };
  }, []);

  const openProfile = useCallback(() => {
    router.push(ROUTES.profile);
  }, [router]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const openRideDetails = useCallback(
    (ride: UpcomingRideSummary) => {
      const role = ride.role ?? (isDriving ? 'driver' : 'rider');
      if (role !== 'driver' || ride.assured) {
        return;
      }
      router.push(getDriverTrackRidePath(ride.id));
    },
    [isDriving, router],
  );

  const openPastRide = useCallback(
    (ride: HistoryRideItem) => {
      const role = ride.role ?? (isDriving ? 'driver' : 'rider');
      if (role === 'rider') {
        router.push(
          getRideInvoicePath({
            rideId: ride.id,
            pickupLabel: ride.pickupLabel,
            dropoffLabel: ride.dropoffLabel,
            dateLabel: ride.dateLabel,
          }),
        );
        return;
      }
      router.push(
        getTripDetailsPath({
          rideId: ride.id,
          origin: ride.pickupLabel,
          destination: ride.dropoffLabel,
        }),
      );
    },
    [isDriving, router],
  );

  const modifyRide = useCallback(
    (ride: UpcomingRideSummary) => {
      router.push(
        getModifyRidePath({
          rideId: ride.id,
          pickupLabel: ride.pickupLabel,
          dropoffLabel: ride.dropoffLabel,
          dateLabel: ride.dateLabel,
        }),
      );
    },
    [router],
  );

  const trackRide = useCallback(
    (ride: UpcomingRideSummary) => {
      const role = ride.role ?? (isDriving ? 'driver' : 'rider');
      if (role === 'driver') {
        router.push(getDriverPickupPath(rideKindFromAssuredFlag(ride.assured)));
        return;
      }
      router.push(ROUTES.rideSearchLiveTracking);
    },
    [isDriving, router],
  );

  const cancelRequest = useCallback(
    (ride: UpcomingRideSummary) => {
      const role = ride.role ?? (isDriving ? 'driver' : 'rider');
      router.push(
        getCancelUpcomingRidePath({
          rideId: ride.id,
          dateLabel: ride.dateLabel,
          title: ride.title,
          pickupLabel: ride.pickupLabel,
          dropoffLabel: ride.dropoffLabel,
          mode: role === 'driver' ? 'driving' : 'riding',
          assured: ride.assured,
        }),
      );
    },
    [isDriving, router],
  );

  return {
    mode,
    surface,
    showModeBadge,
    modeBadge: isDriving ? MY_RIDES_SCREEN.driverModeBadge : MY_RIDES_SCREEN.riderModeBadge,
    tab,
    setTab,
    avatarUri: user?.avatarUri ?? DEFAULT_PROFILE_AVATAR,
    upcomingRides,
    historyRides,
    cancelLabel: isDriving
      ? MY_RIDES_SCREEN.cancelLabelDriving
      : MY_RIDES_SCREEN.cancelLabelRiding,
    modifyLabel: MY_RIDES_SCREEN.modifyLabel,
    trackLabel: isDriving
      ? MY_RIDES_SCREEN.trackLabelDriving
      : MY_RIDES_SCREEN.trackLabelRiding,
    peerLabel: isDriving ? MY_RIDES_SCREEN.peerLabelDriving : MY_RIDES_SCREEN.peerLabelRiding,
    emptyUpcomingSubtitle: isOfficeCommute
      ? MY_RIDES_SCREEN.emptyUpcomingSubtitleOffice
      : isDriving
        ? MY_RIDES_SCREEN.emptyUpcomingSubtitleDriving
        : MY_RIDES_SCREEN.emptyUpcomingSubtitleRiding,
    emptyPastSubtitle: isOfficeCommute
      ? MY_RIDES_SCREEN.emptyPastSubtitleOffice
      : isDriving
        ? MY_RIDES_SCREEN.emptyPastSubtitleDriving
        : MY_RIDES_SCREEN.emptyPastSubtitleRiding,
    resolveRideRole,
    labelsForRole,
    openProfile,
    openNotifications,
    openRideDetails,
    openPastRide,
    modifyRide,
    trackRide,
    cancelRequest,
  };
};
