import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { listMyRides, listRideHistory, startRideById, type RideResponseDto } from '@/features/offer-ride/api';
import { driverLocationPublisher } from '@/services/location';
import { listVehicles, type VehicleResponse } from '@/features/profile/api';
import {
  getPublicRideById,
  listBookingHistory,
  listDriverBookings,
  listMyBookings,
  type BookingResponseDto,
} from '@/features/ride-search/api';
import { enrichBookingsWithPublicRideVehicles } from '@/features/ride-search/utils/bookingVehicle';
import { useSessionUser } from '@/shared/hooks';
import { ensureRideCoords, rideCoordsCache } from '@/shared/maps';
import { rideVehicleCache } from '@/features/ride-search/utils/rideVehicleCache';
import { getErrorMessage, showAppAlert } from '@/shared/utils';
import { getLiveTrackingPath } from '@/features/ride-search/constants';
import { appModeStore, authSession, type AppMode } from '@/store';
import {
  DEFAULT_PROFILE_AVATAR,
  getCancelUpcomingRidePath,
  getDriverTrackRidePath,
  getDriverPickupPath,
  getDriverActiveTripPath,
  getModifyRidePath,
  getRideInvoicePath,
  getTripDetailsPath,
  getRiderBookedRidePath,
  getCommuteBookingRequestsPath,
  MY_RIDES_SCREEN,
  TRIP_LIFECYCLE_COPY,
} from '../constants';
import {
  filterHistoryApiBookings,
  filterOfficeCommuteBookings,
  filterOfficeCommuteDriverRides,
  filterStandardBookings,
  filterStandardDriverRides,
  filterUpcomingApiBookings,
  groupActiveDriverBookingsByRideId,
  countPendingCommuteBookingsByRideId,
  filterPendingCommuteBookings,
  isCommuteApiBooking,
  isCommuteApiRide,
  isHistoryRideStatus,
  isUpcomingRideStatus,
  mapApiBookingToHistory,
  mapApiBookingToUpcoming,
  mapBookingHistoryListItem,
  mapRideHistoryListItem,
  mapRideResponseToHistory,
  mapRideResponseToUpcoming,
  canModifyRegularUpcomingRide,
  resolveDriverTripPhase,
  resolveDriverRideKindFromCard,
  mapLifecycleError,
  mergeSortedHistoryRides,
  sortUpcomingRidesByNearest,
} from '../utils';
import {
  myRidesSurfaceStore,
  type MyRidesSurface,
  upcomingRideCancelledStore,
} from '../store';
import { driverRidesRefreshStore } from '../store/driverRidesRefreshStore';
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
  historyLoading: boolean;
  historyLoadingMore: boolean;
  historyError: string | null;
  historyHasMore: boolean;
  loadMoreHistory: () => Promise<void>;
  cancelLabel: string;
  modifyLabel: string;
  trackLabel: string;
  peerLabel: string;
  emptyUpcomingSubtitle: string;
  emptyPastSubtitle: string;
  refreshing: boolean;
  refresh: () => Promise<void>;
  resolveRideRole: (ride: UpcomingRideSummary) => MyRidesRideRole;
  labelsForRole: (role: MyRidesRideRole) => {
    peerLabel: string;
    cancelLabel: string;
    trackLabel: string;
  };
  trackLabelForRide: (ride: UpcomingRideSummary) => string;
  openProfile: () => void;
  openNotifications: () => void;
  openRideDetails: (ride: UpcomingRideSummary) => void;
  openBookingRequests: () => void;
  pendingCommuteRequestCount: number;
  openPastRide: (ride: HistoryRideItem) => void;
  modifyRide: (ride: UpcomingRideSummary) => void;
  trackRide: (ride: UpcomingRideSummary) => void;
  cancelRequest: (ride: UpcomingRideSummary) => void;
}

const isApiError = (error: unknown): error is { status: number } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as { status?: unknown }).status === 'number';

const HISTORY_PAGE_LIMIT = 20;

export const useMyRides = (): UseMyRidesResult => {
  const router = useRouter();
  const user = useSessionUser();
  const [tab, setTab] = useState<MyRidesTab>('upcoming');
  const [mode, setMode] = useState<AppMode>(() => appModeStore.get());
  const [surface, setSurface] = useState<MyRidesSurface>(() => myRidesSurfaceStore.get());
  const [upcomingCancelled, setUpcomingCancelled] = useState(() =>
    upcomingRideCancelledStore.get(),
  );
  const [myDriverRides, setMyDriverRides] = useState<RideResponseDto[]>([]);
  const [myBookings, setMyBookings] = useState<BookingResponseDto[]>([]);
  const [driverBookings, setDriverBookings] = useState<BookingResponseDto[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<string, VehicleResponse>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [startingRideId, setStartingRideId] = useState<string | null>(null);
  const [historyRides, setHistoryRides] = useState<HistoryRideItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageRef = useRef(1);
  const myDriverRidesRef = useRef(myDriverRides);
  const myBookingsRef = useRef(myBookings);
  myDriverRidesRef.current = myDriverRides;
  myBookingsRef.current = myBookings;
  historyPageRef.current = historyPage;

  useEffect(() => appModeStore.subscribe(setMode), []);
  useEffect(() => myRidesSurfaceStore.subscribe(setSurface), []);
  useEffect(() => upcomingRideCancelledStore.subscribe(setUpcomingCancelled), []);

  const loadLists = useCallback(async () => {
    if (!authSession.getToken()) {
      return;
    }
    try {
      const [driverRows, passengerBookingRows, driverBookingRows, vehicleRows] =
        await Promise.all([
          listMyRides().catch((error) => {
            console.log('[My Rides] GET /rides/my failed', getErrorMessage(error));
            if (isApiError(error) && error.status === 401) {
              throw error;
            }
            return [] as RideResponseDto[];
          }),
          listMyBookings().catch((error) => {
            console.log('[My Rides] GET /bookings/my failed', getErrorMessage(error));
            if (isApiError(error) && error.status === 401) {
              throw error;
            }
            return [] as BookingResponseDto[];
          }),
          listDriverBookings({ page: 1, limit: 50 }).catch((error) => {
            console.log(
              '[My Rides] GET /bookings/driver/my-rides failed',
              getErrorMessage(error),
            );
            if (isApiError(error) && error.status === 401) {
              throw error;
            }
            return [] as BookingResponseDto[];
          }),
          listVehicles().catch((error) => {
            console.log('[My Rides] GET /vehicles failed', getErrorMessage(error));
            return [] as VehicleResponse[];
          }),
        ]);

      // Maps need lat/lng; API stores addresses only. Hydrate cache then geocode gaps.
      await rideCoordsCache.hydrate();
      await rideVehicleCache.hydrate();
      await Promise.all([
        ...passengerBookingRows.map((booking) => {
          const rideId = booking.rideId?.trim() || booking.ride?.id?.trim() || '';
          if (!rideId) {
            return Promise.resolve(null);
          }
          return ensureRideCoords({
            rideId,
            originAddress: booking.ride?.source,
            destinationAddress: booking.ride?.destination,
          });
        }),
        ...driverRows.map((ride) => {
          const rideId = ride.id?.trim() || '';
          if (!rideId) {
            return Promise.resolve(null);
          }
          return ensureRideCoords({
            rideId,
            originAddress: ride.source,
            destinationAddress: ride.destination,
          });
        }),
      ]);

      setMyDriverRides(driverRows);
      const enrichedPassengerBookings = await enrichBookingsWithPublicRideVehicles(
        passengerBookingRows,
        getPublicRideById,
      );
      setMyBookings(enrichedPassengerBookings);
      setDriverBookings(driverBookingRows);
      const nextVehicles: Record<string, VehicleResponse> = {};
      for (const vehicle of vehicleRows) {
        nextVehicles[vehicle.id] = vehicle;
      }
      setVehiclesById(nextVehicles);
      upcomingRideCancelledStore.setCancelled(false);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        authSession.clear();
        router.replace(ROUTES.welcome);
      }
    }
  }, [router]);

  useEffect(
    () =>
      driverRidesRefreshStore.subscribe(() => {
        void loadLists();
      }),
    [loadLists],
  );

  const isDriving = mode === 'driving';
  const isOfficeCommute = surface === 'office-commute';
  const showModeBadge = !isOfficeCommute;

  const hydrateHistoryCoords = useCallback(async (items: HistoryRideItem[]) => {
    await rideCoordsCache.hydrate();
    return Promise.all(
      items.map(async (item) => {
        if (item.pickup && item.dropoff) {
          return item;
        }
        const rideId = item.rideId?.trim() || item.id?.trim() || '';
        if (!rideId) {
          return item;
        }
        try {
          const resolved = await ensureRideCoords({
            rideId,
            originAddress: item.pickupLabel,
            destinationAddress: item.dropoffLabel,
          });
          return {
            ...item,
            pickup: item.pickup ?? resolved.origin ?? null,
            dropoff: item.dropoff ?? resolved.destination ?? null,
          };
        } catch {
          return item;
        }
      }),
    );
  }, []);

  const buildFallbackHistory = useCallback((): HistoryRideItem[] => {
    if (isOfficeCommute) {
      const driverHistory = filterOfficeCommuteDriverRides(myDriverRidesRef.current)
        .filter((row) => isHistoryRideStatus(row.status))
        .map(mapRideResponseToHistory);
      const riderHistory = filterOfficeCommuteBookings(
        filterHistoryApiBookings(myBookingsRef.current),
      ).map(mapApiBookingToHistory);
      return mergeSortedHistoryRides([], [...driverHistory, ...riderHistory]);
    }

    if (isDriving) {
      return mergeSortedHistoryRides(
        [],
        filterStandardDriverRides(myDriverRidesRef.current)
          .filter((row) => isHistoryRideStatus(row.status))
          .map(mapRideResponseToHistory),
      );
    }
    return mergeSortedHistoryRides(
      [],
      filterStandardBookings(filterHistoryApiBookings(myBookingsRef.current)).map(
        mapApiBookingToHistory,
      ),
    );
  }, [isDriving, isOfficeCommute]);

  const loadHistory = useCallback(
    async (options?: { reset?: boolean; page?: number }) => {
      if (!authSession.getToken()) {
        return;
      }

      const reset = options?.reset ?? false;
      const nextPage = options?.page ?? (reset ? 1 : historyPageRef.current);

      if (reset) {
        setHistoryLoading(true);
        setHistoryError(null);
      } else {
        setHistoryLoadingMore(true);
      }

      try {
        let mapped: HistoryRideItem[] = [];
        let page = nextPage;
        let hasMore = false;
        let usedFallback = false;

        try {
          if (isOfficeCommute) {
            const [driverResult, riderResult] = await Promise.all([
              listRideHistory({ page: nextPage, limit: HISTORY_PAGE_LIMIT }),
              listBookingHistory({ page: nextPage, limit: HISTORY_PAGE_LIMIT }),
            ]);
            mapped = [
              ...driverResult.items
                .filter((item) => isCommuteApiRide(item))
                .map((item) => mapRideHistoryListItem(item))
                .filter((item) => isHistoryRideStatus(item.status)),
              ...riderResult.items
                .filter((item) => isCommuteApiBooking(item))
                .map((item) => mapBookingHistoryListItem(item)),
            ].filter((item) => Boolean(item.id?.trim()));
            page = Math.max(driverResult.page, riderResult.page);
            hasMore = driverResult.hasMore || riderResult.hasMore;
          } else if (isDriving) {
            const result = await listRideHistory({ page: nextPage, limit: HISTORY_PAGE_LIMIT });
            mapped = result.items
              .filter((item) => !isCommuteApiRide(item))
              .map((item) => mapRideHistoryListItem(item))
              .filter((item) => isHistoryRideStatus(item.status))
              .filter((item) => Boolean(item.id?.trim()));
            page = result.page;
            hasMore = result.hasMore;
          } else {
            const result = await listBookingHistory({ page: nextPage, limit: HISTORY_PAGE_LIMIT });
            mapped = result.items
              .filter((item) => !isCommuteApiBooking(item))
              .map((item) => mapBookingHistoryListItem(item))
              .filter((item) => Boolean(item.id?.trim()));
            page = result.page;
            hasMore = result.hasMore;
          }
        } catch (historyError) {
          console.log(
            '[My Rides] history endpoint failed — falling back to /my',
            getErrorMessage(historyError),
          );
          if (isApiError(historyError) && historyError.status === 401) {
            throw historyError;
          }
          // Only fall back on first page; load-more should surface the error.
          if (!reset && nextPage > 1) {
            throw historyError;
          }
          mapped = buildFallbackHistory();
          page = 1;
          hasMore = false;
          usedFallback = true;
        }

        // History API succeeded but returned nothing — if /my still has completed
        // rides, use those so Past is not falsely empty (unwrap/shape mismatches).
        if (!usedFallback && reset && mapped.length === 0) {
          const fallback = buildFallbackHistory();
          if (fallback.length > 0) {
            console.log(
              '[My Rides] history endpoint empty — using COMPLETED/CANCELLED from /my',
              { count: fallback.length, isDriving },
            );
            mapped = fallback;
            page = 1;
            hasMore = false;
          }
        }

        const hydrated = await hydrateHistoryCoords(mapped);
        setHistoryRides((current) =>
          mergeSortedHistoryRides(reset || usedFallback ? [] : current, hydrated),
        );
        setHistoryPage(page);
        historyPageRef.current = page;
        setHistoryHasMore(hasMore);
        setHistoryError(null);
      } catch (error) {
        console.log('[My Rides] history fetch failed', getErrorMessage(error));
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          router.replace(ROUTES.welcome);
          return;
        }
        // Last resort: show whatever we can from /my so Past is not blank.
        if (reset) {
          const fallback = buildFallbackHistory();
          if (fallback.length > 0) {
            const hydrated = await hydrateHistoryCoords(fallback);
            setHistoryRides(mergeSortedHistoryRides([], hydrated));
            setHistoryPage(1);
            historyPageRef.current = 1;
            setHistoryHasMore(false);
            setHistoryError(null);
            return;
          }
        }
        setHistoryError(MY_RIDES_SCREEN.historyLoadingError);
      } finally {
        setHistoryLoading(false);
        setHistoryLoadingMore(false);
      }
    },
    [buildFallbackHistory, hydrateHistoryCoords, isDriving, isOfficeCommute, router],
  );

  useEffect(
    () =>
      driverRidesRefreshStore.subscribe(() => {
        void loadHistory({ reset: true, page: 1 });
      }),
    [loadHistory],
  );

  const loadMoreHistory = useCallback(async () => {
    if (historyLoading || historyLoadingMore || !historyHasMore) {
      return;
    }
    await loadHistory({ reset: false, page: historyPage + 1 });
  }, [historyHasMore, historyLoading, historyLoadingMore, historyPage, loadHistory]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        await loadLists();
        if (!active) {
          return;
        }
        if (tab === 'past') {
          await loadHistory({ reset: true, page: 1 });
        }
      })();
      return () => {
        active = false;
      };
    }, [loadHistory, loadLists, tab]),
  );

  useEffect(() => {
    if (tab !== 'past') {
      return;
    }
    void loadHistory({ reset: true, page: 1 });
  }, [isDriving, isOfficeCommute, tab]);
  // loadHistory intentionally omitted: identity is stable enough via refs;
  // mode/tab changes are the triggers. Focus effect covers refresh on entry.

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadLists();
      if (tab === 'past') {
        await loadHistory({ reset: true, page: 1 });
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadHistory, loadLists, tab]);

  const ridersByRideId = useMemo(
    () => groupActiveDriverBookingsByRideId(driverBookings),
    [driverBookings],
  );

  const pendingByRideId = useMemo(
    () => countPendingCommuteBookingsByRideId(driverBookings),
    [driverBookings],
  );

  const pendingCommuteRequestCount = useMemo(
    () => filterPendingCommuteBookings(driverBookings).length,
    [driverBookings],
  );

  const upcomingRides = useMemo((): readonly UpcomingRideSummary[] => {
    const mapDriverUpcoming = (row: RideResponseDto): UpcomingRideSummary => {
      const mapped = mapRideResponseToUpcoming(row);
      const riders = ridersByRideId[mapped.id] ?? [];
      const vehicle = vehiclesById[row.vehicleId];
      const vehicleLabel = vehicle
        ? [vehicle.make, vehicle.model].filter(Boolean).join(' ')
        : mapped.vehicleLabel;
      return {
        ...mapped,
        riders,
        bookingCount: riders.length,
        pendingRequestCount: pendingByRideId[mapped.id] ?? 0,
        vehicleLabel: vehicleLabel || undefined,
        peer: {
          ...mapped.peer,
          plateNumber: vehicleLabel || mapped.peer.plateNumber,
        },
        driver: {
          ...mapped.driver,
          plateNumber: vehicleLabel || mapped.driver.plateNumber,
        },
      };
    };

    if (isOfficeCommute) {
      const driverCards = filterOfficeCommuteDriverRides(myDriverRides)
        .filter((row) => isUpcomingRideStatus(row.status))
        .map(mapDriverUpcoming);
      const riderCards = filterOfficeCommuteBookings(filterUpcomingApiBookings(myBookings)).map(
        mapApiBookingToUpcoming,
      );
      return sortUpcomingRidesByNearest([...driverCards, ...riderCards]);
    }

    if (upcomingCancelled && !isDriving) {
      return [];
    }

    if (isDriving) {
      return sortUpcomingRidesByNearest(
        filterStandardDriverRides(myDriverRides)
          .filter((row) => isUpcomingRideStatus(row.status))
          .map(mapDriverUpcoming),
      );
    }

    return sortUpcomingRidesByNearest(
      filterStandardBookings(filterUpcomingApiBookings(myBookings)).map(
        mapApiBookingToUpcoming,
      ),
    );
  }, [
    isDriving,
    isOfficeCommute,
    myBookings,
    myDriverRides,
    ridersByRideId,
    pendingByRideId,
    upcomingCancelled,
    vehiclesById,
  ]);

  const resolveRideRole = useCallback(
    (ride: UpcomingRideSummary): MyRidesRideRole => {
      if (ride.role) {
        return ride.role;
      }
      if (isOfficeCommute) {
        return 'rider';
      }
      return isDriving ? 'driver' : 'rider';
    },
    [isDriving, isOfficeCommute],
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

  const trackLabelForRide = useCallback(
    (ride: UpcomingRideSummary) => {
      const role = resolveRideRole(ride);
      if (role !== 'driver') {
        return labelsForRole(role).trackLabel;
      }
      const status = String(ride.rideStatus ?? '').toUpperCase();
      if (status === 'IN_PROGRESS') {
        return MY_RIDES_SCREEN.trackLabelDrivingInProgress;
      }
      return MY_RIDES_SCREEN.trackLabelDriving;
    },
    [labelsForRole, resolveRideRole],
  );

  const openProfile = useCallback(() => {
    router.push(ROUTES.profile);
  }, [router]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const openRideDetails = useCallback(
    (ride: UpcomingRideSummary) => {
      const role =
        ride.role ?? (isOfficeCommute ? 'rider' : isDriving ? 'driver' : 'rider');
      const rideId = (ride.rideId || ride.id || '').trim();

      if (role === 'driver') {
        if (!rideId) {
          showAppAlert('Ride Details', 'This ride is missing an ID. Pull to refresh and try again.');
          return;
        }
        router.push(getDriverTrackRidePath(rideId));
        return;
      }

      const bookingId = (ride.bookingId || ride.id || '').trim();
      if (!bookingId) {
        showAppAlert('Ride Details', 'This booking is missing an ID. Pull to refresh and try again.');
        return;
      }

      router.push(
        getRiderBookedRidePath({
          bookingId,
          rideId,
        }),
      );
    },
    [isDriving, isOfficeCommute, router],
  );

  const openPastRide = useCallback(
    (ride: HistoryRideItem) => {
      const role = isOfficeCommute
        ? (ride.role ?? 'rider')
        : isDriving
          ? 'driver'
          : 'rider';
      const rideType = resolveDriverRideKindFromCard(ride);
      if (role === 'rider') {
        const bookingId = (ride.bookingId || ride.id || '').trim();
        if (!bookingId) {
          showAppAlert('Ride Details', 'This past booking is missing an ID. Pull to refresh and try again.');
          return;
        }
        router.push(
          getRideInvoicePath({
            bookingId,
            rideId: (ride.rideId || bookingId).trim(),
            rideType,
          }),
        );
        return;
      }
      const rideId = (ride.rideId || ride.id || '').trim();
      if (!rideId) {
        showAppAlert('Trip Details', 'This past ride is missing an ID. Pull to refresh and try again.');
        return;
      }
      router.push(
        getTripDetailsPath({
          rideId,
          rideType,
        }),
      );
    },
    [isDriving, isOfficeCommute, router],
  );

  const modifyRide = useCallback(
    (ride: UpcomingRideSummary) => {
      if (!canModifyRegularUpcomingRide(ride)) {
        return;
      }
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
      const role =
        ride.role ?? (isOfficeCommute ? 'rider' : isDriving ? 'driver' : 'rider');
      if (role === 'driver') {
        const rideType = resolveDriverRideKindFromCard(ride);
        const rideId = (ride.rideId || ride.id || '').trim();

        if (!rideId) {
          showAppAlert(
            TRIP_LIFECYCLE_COPY.startFailedTitle,
            'This ride is missing an ID. Pull to refresh and try again.',
          );
          return;
        }

        if (startingRideId) {
          return;
        }

        const openPickup = () => {
          router.push(
            getDriverPickupPath({
              rideType,
              rideId,
              destination: ride.dropoffLabel,
            }),
          );
        };

        const alreadyInProgress =
          String(ride.rideStatus ?? '').toUpperCase() === 'IN_PROGRESS';

        if (alreadyInProgress) {
          void driverLocationPublisher.ensure(rideId);
          void (async () => {
            try {
              const bookings = await listDriverBookings({
                rideId,
                page: 1,
                limit: 50,
              });
              const phase = resolveDriverTripPhase(ride.rideStatus, bookings);
              if (phase === 'ACTIVE_TRIP') {
                router.push(
                  getDriverActiveTripPath({
                    rideType,
                    rideId,
                    destination: ride.dropoffLabel,
                  }),
                );
                return;
              }
              openPickup();
            } catch (error) {
              console.log('[MyRides] resume IN_PROGRESS failed', error);
              openPickup();
            }
          })();
          return;
        }

        setStartingRideId(rideId);
        void (async () => {
          try {
            await startRideById(rideId);
            void driverLocationPublisher.ensure(rideId);
            driverRidesRefreshStore.bump();
            await refresh();
            openPickup();
          } catch (error) {
            if (isApiError(error) && error.status === 401) {
              authSession.clear();
              router.replace(ROUTES.welcome);
              return;
            }
            if (isApiError(error) && error.status === 409) {
              void driverLocationPublisher.ensure(rideId);
              driverRidesRefreshStore.bump();
              await refresh();
              openPickup();
              return;
            }
            showAppAlert(
              TRIP_LIFECYCLE_COPY.startFailedTitle,
              mapLifecycleError(error, 'Please try again.'),
            );
          } finally {
            setStartingRideId(null);
          }
        })();
        return;
      }

      if (ride.commute && String(ride.bookingStatus ?? '').toUpperCase() === 'PENDING') {
        const bookingId = (ride.bookingId || ride.id || '').trim();
        if (bookingId) {
          router.push({
            pathname: ROUTES.officeCommuteBooked,
            params: { bookingId },
          });
          return;
        }
      }

      const rideType = resolveDriverRideKindFromCard(ride);
      router.push(
        getLiveTrackingPath({
          rideId: ride.rideId || ride.id,
          rideType: rideType === 'commute' ? 'regular' : rideType,
          origin: ride.pickupLabel,
          destination: ride.dropoffLabel,
          driverName: ride.peer?.name,
          carModel: ride.peer?.vehicleLabel,
          plateNumber: ride.peer?.plateNumber,
          price: ride.fareTotal,
          originLat: ride.pickup?.latitude,
          originLng: ride.pickup?.longitude,
          destinationLat: ride.dropoff?.latitude,
          destinationLng: ride.dropoff?.longitude,
          bookingId: ride.bookingId || ride.id,
        }),
      );
    },
    [isDriving, isOfficeCommute, refresh, router, startingRideId],
  );

  const cancelRequest = useCallback(
    (ride: UpcomingRideSummary) => {
      const role =
        ride.role ?? (isOfficeCommute ? 'rider' : isDriving ? 'driver' : 'rider');
      router.push(
        getCancelUpcomingRidePath({
          rideId: ride.bookingId || ride.id,
          dateLabel: ride.dateLabel,
          title: ride.title,
          pickupLabel: ride.pickupLabel,
          dropoffLabel: ride.dropoffLabel,
          mode: role === 'driver' ? 'driving' : 'riding',
          assured: ride.assured,
          commute: ride.commute,
          seriesId: ride.seriesId,
        }),
      );
    },
    [isDriving, isOfficeCommute, router],
  );

  const openBookingRequests = useCallback(() => {
    router.push(getCommuteBookingRequestsPath());
  }, [router]);

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
    historyLoading,
    historyLoadingMore,
    historyError,
    historyHasMore,
    loadMoreHistory,
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
    refreshing,
    refresh,
    resolveRideRole,
    labelsForRole,
    trackLabelForRide,
    openProfile,
    openNotifications,
    openRideDetails,
    openBookingRequests,
    pendingCommuteRequestCount,
    openPastRide,
    modifyRide,
    trackRide,
    cancelRequest,
  };
};
