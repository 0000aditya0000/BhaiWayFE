import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { sosSession } from '@/features/sos';
import { completeRideById, getRideById } from '@/features/offer-ride/api';
import { listDriverBookings } from '@/features/ride-search/api';
import { fetchDrivingRoute } from '@/features/ride-search/services';
import { driverLocationPublisher } from '@/services/location';
import { trackingSocket } from '@/services/realtime';
import {
  BHAIWAY_LOCATION_MESSAGES,
  estimateDurationMinutes,
  formatDistanceKmLabel,
  formatEtaLabel,
  haversineDistanceKm,
  isValidMapCoordinate,
  rideCoordsCache,
  type MapLatLng,
} from '@/shared/maps';
import { getSearchParam, resetTo, showAppAlert } from '@/shared/utils';
import {
  ACTIVE_TRIP_STATUS_POLL_MS,
  COMPLETE_RIDE_TIMEOUT_MS,
  DEFAULT_DRIVER_ACTIVE_TRIP,
  TRIP_LIFECYCLE_COPY,
  getDriverTripCompletedPath,
} from '../constants';
import type { ActiveTripPassenger, ActiveTripSummary } from '../types';
import {
  filterConfirmedDriverBookings,
  isCompletedRideStatus,
  isRegularRide,
  mapDriverBookingToActiveTripPassenger,
  mapLifecycleError,
} from '../utils';
import { useDriverRideKind } from './useDriverRideKind';
import { useShareDriverRideLocation } from './useShareDriverRideLocation';

export interface UseDriverActiveTripResult {
  trip: ActiveTripSummary;
  driverCoordinate: MapLatLng | null;
  isRegular: boolean;
  completed: boolean;
  completing: boolean;
  completeTrip: () => void;
  triggerSos: () => void;
  toggleVoice: () => void;
  goBack: () => void;
  openLocationSettings: () => void;
  openGoogleMaps: () => void;
}

export const useDriverActiveTrip = (): UseDriverActiveTripResult => {
  const router = useRouter();
  const rideType = useDriverRideKind();
  const params = useLocalSearchParams<{ rideId?: string; destination?: string }>();
  const rideId = getSearchParam(params.rideId).trim();
  const destinationParam = getSearchParam(params.destination).trim();
  const isRegular = isRegularRide(rideType);

  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [destinationCoordinate, setDestinationCoordinate] = useState<MapLatLng | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<MapLatLng[]>([]);
  const [routeEtaMinutes, setRouteEtaMinutes] = useState<number | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [passengers, setPassengers] = useState<readonly ActiveTripPassenger[]>([]);
  const lastDestinationRef = useRef<MapLatLng | null>(null);
  const completedNavRef = useRef(false);

  const refreshPassengers = useCallback(async () => {
    if (!rideId) {
      setPassengers([]);
      return;
    }
    try {
      const bookings = await listDriverBookings({ rideId, page: 1, limit: 50 });
      const confirmed = filterConfirmedDriverBookings(bookings);
      setPassengers(confirmed.map(mapDriverBookingToActiveTripPassenger));
    } catch (error) {
      console.log('[DriverActiveTrip] listDriverBookings failed', error);
    }
  }, [rideId]);

  useEffect(() => {
    void refreshPassengers();
  }, [refreshPassengers]);

  useFocusEffect(
    useCallback(() => {
      void refreshPassengers();
    }, [refreshPassengers]),
  );

  const {
    coordinate: driverCoordinate,
    locationErrorMessage,
    openLocationSettings,
  } = useShareDriverRideLocation({
    rideId,
    enabled: Boolean(rideId) && !completed,
    isRegular,
  });

  useEffect(() => {
    if (!rideId) {
      setDestinationCoordinate(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const cached = await rideCoordsCache.get(rideId);
      if (cancelled) {
        return;
      }
      setDestinationCoordinate(
        isValidMapCoordinate(cached?.destination) ? cached!.destination! : null,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  useEffect(() => {
    if (
      !isValidMapCoordinate(driverCoordinate) ||
      !isValidMapCoordinate(destinationCoordinate)
    ) {
      setRouteCoordinates([]);
      setRouteEtaMinutes(null);
      setRouteDistanceKm(null);
      return;
    }

    const prevDestination = lastDestinationRef.current;
    const destinationMoved =
      !prevDestination ||
      haversineDistanceKm(prevDestination, destinationCoordinate) >= 0.05;
    if (destinationMoved) {
      lastDestinationRef.current = destinationCoordinate;
      setRouteEtaMinutes(null);
      setRouteDistanceKm(null);
    }

    let cancelled = false;

    void (async () => {
      try {
        const route = await fetchDrivingRoute(driverCoordinate, destinationCoordinate);
        if (cancelled) {
          return;
        }
        setRouteCoordinates(
          route.coordinates.length >= 2
            ? route.coordinates
            : [driverCoordinate, destinationCoordinate],
        );
        setRouteEtaMinutes(
          Number.isFinite(route.durationMinutes)
            ? Math.max(1, Math.round(route.durationMinutes))
            : null,
        );
        setRouteDistanceKm(
          Number.isFinite(route.distanceKm)
            ? route.distanceKm
            : haversineDistanceKm(driverCoordinate, destinationCoordinate),
        );
      } catch {
        if (!cancelled) {
          setRouteCoordinates([driverCoordinate, destinationCoordinate]);
          const km = haversineDistanceKm(driverCoordinate, destinationCoordinate);
          setRouteEtaMinutes(estimateDurationMinutes(km));
          setRouteDistanceKm(km);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destinationCoordinate, driverCoordinate]);

  const trip = useMemo<ActiveTripSummary>(() => {
    if (!isRegular) {
      return {
        ...DEFAULT_DRIVER_ACTIVE_TRIP,
        destinationLabel: destinationParam || DEFAULT_DRIVER_ACTIVE_TRIP.destinationLabel,
        destinationCoordinate: null,
        routeCoordinates: [],
        locationErrorMessage: null,
        passengers,
      };
    }

    let remainingKm: number | null = null;
    if (
      routeEtaMinutes != null &&
      routeEtaMinutes > 0 &&
      routeDistanceKm != null &&
      Number.isFinite(routeDistanceKm)
    ) {
      remainingKm = routeDistanceKm;
    } else if (
      isValidMapCoordinate(driverCoordinate) &&
      isValidMapCoordinate(destinationCoordinate)
    ) {
      remainingKm = haversineDistanceKm(driverCoordinate, destinationCoordinate);
    }

    const etaMinutes =
      routeEtaMinutes != null && Number.isFinite(routeEtaMinutes) && routeEtaMinutes > 0
        ? routeEtaMinutes
        : remainingKm == null
          ? null
          : estimateDurationMinutes(remainingKm);
    return {
      destinationLabel: destinationParam || 'Destination',
      etaMinutes,
      etaLabel: formatEtaLabel(etaMinutes),
      distanceLabel: remainingKm == null ? '' : formatDistanceKmLabel(remainingKm),
      progress: 0,
      destinationCoordinate,
      routeCoordinates,
      locationErrorMessage:
        locationErrorMessage ||
        (!driverCoordinate ? BHAIWAY_LOCATION_MESSAGES.liveUnavailable : null),
      navStep: {
        instruction: destinationParam
          ? `Continue toward ${destinationParam}`
          : 'Follow your route',
        distanceLabel: remainingKm == null ? '—' : formatDistanceKmLabel(remainingKm),
        icon: 'return-up-forward',
      },
      passengers,
    };
  }, [
    destinationCoordinate,
    destinationParam,
    driverCoordinate,
    isRegular,
    locationErrorMessage,
    passengers,
    routeCoordinates,
    routeDistanceKm,
    routeEtaMinutes,
  ]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const navigateCompletedRef = useRef<() => void>(() => undefined);

  const navigateCompleted = useCallback(() => {
    if (completedNavRef.current) {
      return;
    }
    completedNavRef.current = true;
    if (rideId) {
      trackingSocket.leaveRide(rideId);
    }
    setCompleted(true);
    resetTo(
      router,
      getDriverTripCompletedPath({
        destination: trip.destinationLabel,
        rideType,
        rideId: rideId || undefined,
      }),
    );
  }, [rideId, rideType, router, trip.destinationLabel]);

  navigateCompletedRef.current = navigateCompleted;

  const resolveRideCompletedOnBackend = useCallback(async (): Promise<boolean> => {
    if (!rideId) {
      return false;
    }
    try {
      const ride = await getRideById(rideId);
      return isCompletedRideStatus(ride.status);
    } catch (error) {
      console.log('[DriverActiveTrip] reconcile getRideById failed', error);
      return false;
    }
  }, [rideId]);

  // If Assured complete finishes server-side after a client timeout (or rider
  // already sees COMPLETED), advance the driver UI without another swipe.
  useEffect(() => {
    if (!rideId || completed || completing) {
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const ride = await getRideById(rideId);
        if (cancelled) {
          return;
        }
        if (isCompletedRideStatus(ride.status)) {
          navigateCompletedRef.current();
        }
      } catch (error) {
        console.log('[DriverActiveTrip] status poll failed', error);
      }
    };

    void pollStatus();
    const timer = setInterval(() => {
      void pollStatus();
    }, ACTIVE_TRIP_STATUS_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [completed, completing, rideId]);

  const completeTrip = useCallback(() => {
    if (completed || completing) {
      return;
    }

    if (!rideId) {
      navigateCompleted();
      return;
    }

    setCompleting(true);
    void (async () => {
      try {
        await completeRideById(rideId, {
          timeoutMs: COMPLETE_RIDE_TIMEOUT_MS,
        });
        navigateCompleted();
      } catch (error) {
        // Timeout/conflict often means the ride already completed on the server
        // (Assured settlement can outlive the client abort). Reconcile before alerting.
        if (await resolveRideCompletedOnBackend()) {
          navigateCompleted();
          return;
        }
        showAppAlert(
          TRIP_LIFECYCLE_COPY.completeFailedTitle,
          mapLifecycleError(error, 'Please try again.'),
        );
      } finally {
        setCompleting(false);
      }
    })();
  }, [
    completed,
    completing,
    navigateCompleted,
    resolveRideCompletedOnBackend,
    rideId,
  ]);
  const triggerSos = useCallback(() => {
    if (!rideId) {
      router.push(ROUTES.myRidesEmergencyEnd);
      return;
    }
    sosSession.confirmTrigger(rideId);
  }, [rideId, router]);

  const openGoogleMaps = useCallback(() => {
    if (!isValidMapCoordinate(destinationCoordinate)) {
      showAppAlert(
        'Directions unavailable',
        'Destination coordinates are not available yet for this trip.',
      );
      return;
    }
    const mapsUrl =
      'https://www.google.com/maps/dir/?api=1' +
      `&destination=${destinationCoordinate.latitude},${destinationCoordinate.longitude}` +
      '&travelmode=driving';
    void Linking.openURL(mapsUrl).catch(() => {
      showAppAlert('Google Maps', 'Unable to open Google Maps on this device.');
    });
  }, [destinationCoordinate]);

  const toggleVoice = useCallback(() => {
    showAppAlert('Voice guidance', 'Voice navigation will be available soon.');
  }, []);

  return {
    trip,
    driverCoordinate,
    isRegular,
    completed,
    completing,
    completeTrip,
    triggerSos,
    toggleVoice,
    goBack,
    openLocationSettings,
    openGoogleMaps,
  };
};
