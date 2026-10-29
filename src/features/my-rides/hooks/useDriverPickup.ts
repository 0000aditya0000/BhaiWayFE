import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  listDriverBookings,
  verifyPickupById,
  type BookingResponseDto,
} from '@/features/ride-search/api';
import { fetchDrivingRoute } from '@/features/ride-search/services';
import {
  ensureRideCoords,
  estimateDurationMinutes,
  formatDistanceKmLabel,
  formatEtaLabel,
  haversineDistanceKm,
  isValidMapCoordinate,
  type MapLatLng,
} from '@/shared/maps';
import { getSearchParam, showAppAlert } from '@/shared/utils';
import { authSession } from '@/store';
import {
  DRIVER_PICKUP_SCREEN,
  TRIP_LIFECYCLE_COPY,
  getDriverActiveTripPath,
} from '../constants';
import type { DriverPickupStop } from '../types';
import {
  buildPickupQueue,
  findNextPickupIndex,
  isPickupCompleted,
  isRegularRide,
  mapLifecycleError,
  requiresPickupOtp,
  resolveBookingRecordId,
  resolvePassengerDisplayName,
} from '../utils';
import { useDriverRideKind } from './useDriverRideKind';
import { useShareDriverRideLocation } from './useShareDriverRideLocation';

/** Fraction of the swipe track that opens rider OTP (60%). */
export const DRIVER_PICKUP_OTP_SWIPE_THRESHOLD = 0.6;

const FALLBACK_COORDINATE = { latitude: 12.9352, longitude: 77.6245 } as const;

const isApiError = (error: unknown): error is { status: number } =>
  Boolean(error && typeof error === 'object' && 'status' in error);

const shortPlace = (value: string | undefined): string => {
  const segment = value?.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value?.trim() || 'Pickup';
};

const fullPickupAddress = (booking: BookingResponseDto): string => {
  const source = booking.ride?.source?.trim();
  return source && source.length > 0 ? source : 'Pickup';
};

/** Map sorted active bookings → UI stops. Never attach pickupOtp — driver asks rider. */
const mapQueueToStops = (
  queue: readonly BookingResponseDto[],
  pickupCoordinate: MapLatLng | null,
): DriverPickupStop[] => {
  const total = queue.length;
  return queue.map((booking, index) => {
    const name = resolvePassengerDisplayName(booking);
    const address = fullPickupAddress(booking);
    const bookingId = resolveBookingRecordId(booking);
    return {
      id: bookingId,
      index: index + 1,
      total,
      passengerName: name || 'Passenger',
      locationLabel: address,
      etaLabel: `${booking.seats} seat${booking.seats === 1 ? '' : 's'} · confirmed`,
      coordinate: isValidMapCoordinate(pickupCoordinate)
        ? { ...pickupCoordinate }
        : { ...FALLBACK_COORDINATE },
      otp: '',
    };
  });
};

const emptyStop = (
  pickupAddress: string,
  pickupCoordinate: MapLatLng | null,
): DriverPickupStop => ({
  id: 'empty',
  index: 1,
  total: 1,
  passengerName: 'Passenger',
  locationLabel: pickupAddress || 'Pickup',
  etaLabel: '',
  coordinate: isValidMapCoordinate(pickupCoordinate)
    ? { ...pickupCoordinate }
    : { ...FALLBACK_COORDINATE },
  otp: '',
});

export interface UseDriverPickupResult {
  stop: DriverPickupStop;
  stopTitle: string;
  confirming: boolean;
  requiresOtp: boolean;
  otpVisible: boolean;
  otpValue: string;
  otpError: string | null;
  otpVerifying: boolean;
  confirmedVisible: boolean;
  isLastStop: boolean;
  swipeResetKey: string;
  loadingPassengers: boolean;
  /** Driver live GPS while heading to pickup. */
  driverCoordinate: MapLatLng | null;
  /** Driving route driver → rider pickup. */
  routeCoordinates: MapLatLng[];
  /** Formatted ETA to pickup (e.g. `8 min`). */
  etaLabel: string;
  /** Remaining distance to pickup. */
  distanceLabel: string;
  requestRiderOtp: () => void;
  setOtpValue: (value: string) => void;
  verifyOtp: () => void;
  closeOtp: () => void;
  continueAfterConfirmed: () => void;
  goBack: () => void;
  openNotifications: () => void;
  openGoogleMaps: () => void;
}

export const useDriverPickup = (): UseDriverPickupResult => {
  const router = useRouter();
  const rideType = useDriverRideKind();
  const params = useLocalSearchParams<{ rideId?: string; destination?: string }>();
  const rideId = getSearchParam(params.rideId).trim();
  const destination = getSearchParam(params.destination).trim();
  const isRegular = isRegularRide(rideType);
  const requiresOtp = requiresPickupOtp(rideType);
  /** Both Regular and Assured use backend pickup when a real rideId is present. */
  const usesBackendPickup = Boolean(rideId);

  /** Publish driver GPS while heading to pickup — Regular + Assured after Start Ride. */
  const { coordinate: driverCoordinate } = useShareDriverRideLocation({
    rideId,
    enabled: usesBackendPickup,
    isRegular,
  });

  const [apiStops, setApiStops] = useState<DriverPickupStop[] | null>(null);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpValue, setOtpValueState] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [confirmedVisible, setConfirmedVisible] = useState(false);
  const [swipeEpoch, setSwipeEpoch] = useState(0);
  /** Active bookings still not PICKED_UP — backend source of truth. */
  const [remainingWaitingCount, setRemainingWaitingCount] = useState(0);
  const [pickupCoordinate, setPickupCoordinate] = useState<MapLatLng | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState<MapLatLng[]>([]);
  const [routeEtaMinutes, setRouteEtaMinutes] = useState(0);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  /** Force a fresh route when the pickup pin changes (throttle used to skip this). */
  const lastPickupRef = useRef<MapLatLng | null>(null);
  const otpRequestInFlightRef = useRef(false);
  const bookingQueueRef = useRef<BookingResponseDto[]>([]);

  const applyQueue = useCallback(
    (rows: readonly BookingResponseDto[]) => {
      const queue = buildPickupQueue(rows);
      bookingQueueRef.current = queue;
      const stops = mapQueueToStops(queue, pickupCoordinate);
      const nextIndex = findNextPickupIndex(queue);
      const waitingCount = queue.filter((booking) => !isPickupCompleted(booking)).length;
      setApiStops(stops);
      setRemainingWaitingCount(waitingCount);

      const nextStop = nextIndex >= 0 ? queue[nextIndex] : queue[0];
      if (nextStop?.ride?.source?.trim()) {
        setPickupAddress(nextStop.ride.source.trim());
      }

      if (stops.length === 0) {
        setCurrentIndex(0);
        return { stops, queue, nextIndex: -1, waitingCount: 0 };
      }
      if (nextIndex < 0) {
        setCurrentIndex(Math.max(0, stops.length - 1));
        return { stops, queue, nextIndex: -1, waitingCount };
      }
      setCurrentIndex(nextIndex);
      return { stops, queue, nextIndex, waitingCount };
    },
    [pickupCoordinate],
  );

  const refreshPassengers = useCallback(async () => {
    const rows = await listDriverBookings({ rideId, page: 1, limit: 50 });
    return applyQueue(rows);
  }, [applyQueue, rideId]);

  useEffect(() => {
    if (!usesBackendPickup) {
      setApiStops(null);
      showAppAlert(
        TRIP_LIFECYCLE_COPY.startFailedTitle,
        'This pickup is missing a ride ID. Open the ride from My Rides and try again.',
      );
      router.replace(ROUTES.myRides);
      return;
    }

    let cancelled = false;
    setLoadingPassengers(true);

    void (async () => {
      try {
        const { stops, queue, nextIndex } = await refreshPassengers();
        if (cancelled) {
          return;
        }

        if (stops.length === 0) {
          showAppAlert(
            TRIP_LIFECYCLE_COPY.noPassengersTitle,
            TRIP_LIFECYCLE_COPY.noPassengersMessage,
          );
          router.replace(
            getDriverActiveTripPath({
              rideType,
              rideId,
              destination,
            }),
          );
          return;
        }

        if (nextIndex < 0 && queue.every(isPickupCompleted)) {
          showAppAlert(
            TRIP_LIFECYCLE_COPY.allPickedUpTitle,
            TRIP_LIFECYCLE_COPY.allPickedUpMessage,
          );
          router.replace(
            getDriverActiveTripPath({
              rideType,
              rideId,
              destination,
            }),
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.log('[DriverPickup] listDriverBookings failed', error);
        setApiStops([]);
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          router.replace(ROUTES.welcome);
          return;
        }
        showAppAlert(
          TRIP_LIFECYCLE_COPY.otpFailedTitle,
          mapLifecycleError(
            error,
            'Could not load confirmed passengers for this ride. Please try again from My Rides.',
          ),
        );
      } finally {
        if (!cancelled) {
          setLoadingPassengers(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination, refreshPassengers, rideId, rideType, router, usesBackendPickup]);

  /** Resolve rider pickup pin from on-device cache / geocode of ride source. */
  useEffect(() => {
    if (!usesBackendPickup) {
      setPickupCoordinate(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const resolved = await ensureRideCoords({
        rideId,
        originAddress: pickupAddress || undefined,
        origin: null,
        destination: null,
      });
      if (cancelled) {
        return;
      }
      setPickupCoordinate(
        isValidMapCoordinate(resolved.origin) ? resolved.origin : null,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [pickupAddress, rideId, usesBackendPickup]);

  /** Keep stop pins in sync when pickup coords resolve after bookings load. */
  useEffect(() => {
    if (!isValidMapCoordinate(pickupCoordinate)) {
      return;
    }
    setApiStops((prev) => {
      if (!prev || prev.length === 0) {
        return prev;
      }
      return prev.map((item) => ({
        ...item,
        coordinate: { ...pickupCoordinate },
      }));
    });
  }, [pickupCoordinate]);

  /** Driving route + ETA: driver live GPS → rider pickup (Regular + Assured). */
  useEffect(() => {
    if (
      !usesBackendPickup ||
      !isValidMapCoordinate(driverCoordinate) ||
      !isValidMapCoordinate(pickupCoordinate)
    ) {
      return;
    }

    const prevPickup = lastPickupRef.current;
    const pickupMoved =
      !prevPickup ||
      haversineDistanceKm(prevPickup, pickupCoordinate) >= 0.05;
    if (pickupMoved) {
      lastPickupRef.current = pickupCoordinate;
      setRouteEtaMinutes(0);
      setRouteDistanceKm(null);
    }

    let cancelled = false;

    void (async () => {
      try {
        const route = await fetchDrivingRoute(driverCoordinate, pickupCoordinate);
        if (cancelled) {
          return;
        }
        setRouteCoordinates(
          route.coordinates.length >= 2
            ? route.coordinates
            : [driverCoordinate, pickupCoordinate],
        );
        setRouteEtaMinutes(
          Number.isFinite(route.durationMinutes)
            ? Math.max(1, Math.round(route.durationMinutes))
            : estimateDurationMinutes(
                haversineDistanceKm(driverCoordinate, pickupCoordinate),
              ),
        );
        setRouteDistanceKm(
          Number.isFinite(route.distanceKm)
            ? route.distanceKm
            : haversineDistanceKm(driverCoordinate, pickupCoordinate),
        );
      } catch {
        if (!cancelled) {
          setRouteCoordinates([driverCoordinate, pickupCoordinate]);
          const km = haversineDistanceKm(driverCoordinate, pickupCoordinate);
          setRouteEtaMinutes(estimateDurationMinutes(km));
          setRouteDistanceKm(km);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [driverCoordinate, pickupCoordinate, usesBackendPickup]);

  const stops = useMemo(() => apiStops ?? [], [apiStops]);

  const etaLabel = useMemo(() => {
    if (routeEtaMinutes > 0) {
      return formatEtaLabel(routeEtaMinutes);
    }
    if (
      isValidMapCoordinate(driverCoordinate) &&
      isValidMapCoordinate(pickupCoordinate)
    ) {
      return formatEtaLabel(
        estimateDurationMinutes(haversineDistanceKm(driverCoordinate, pickupCoordinate)),
      );
    }
    return '—';
  }, [driverCoordinate, pickupCoordinate, routeEtaMinutes]);

  const distanceLabel = useMemo(() => {
    if (routeEtaMinutes > 0 && routeDistanceKm != null) {
      return formatDistanceKmLabel(routeDistanceKm);
    }
    if (
      isValidMapCoordinate(driverCoordinate) &&
      isValidMapCoordinate(pickupCoordinate)
    ) {
      return formatDistanceKmLabel(
        haversineDistanceKm(driverCoordinate, pickupCoordinate),
      );
    }
    return '—';
  }, [driverCoordinate, pickupCoordinate, routeDistanceKm, routeEtaMinutes]);

  const stop = useMemo(() => {
    if (stops.length === 0) {
      return emptyStop(pickupAddress, pickupCoordinate);
    }
    const base = stops[Math.min(currentIndex, stops.length - 1)] ?? stops[0];
    const coord = isValidMapCoordinate(pickupCoordinate)
      ? pickupCoordinate
      : base.coordinate;
    const arrivalParts = [
      etaLabel !== '—' ? `Arrival in ${etaLabel}` : null,
      distanceLabel !== '—' ? distanceLabel : null,
    ].filter(Boolean);
    return {
      ...base,
      locationLabel: pickupAddress || base.locationLabel || shortPlace(base.locationLabel),
      coordinate: { ...coord },
      etaLabel:
        arrivalParts.length > 0
          ? arrivalParts.join(' • ')
          : base.etaLabel,
    };
  }, [
    currentIndex,
    distanceLabel,
    etaLabel,
    pickupAddress,
    pickupCoordinate,
    stops,
  ]);

  const isLastStop = usesBackendPickup
    ? remainingWaitingCount === 0
    : stops.length === 0
      ? true
      : currentIndex >= stops.length - 1;
  const stopTitle = DRIVER_PICKUP_SCREEN.pickupTitle(stop.index, stop.total || 1);
  const swipeResetKey = `${stop.id}-${confirming ? 'done' : 'ready'}-${swipeEpoch}`;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const openGoogleMaps = useCallback(() => {
    if (!isValidMapCoordinate(pickupCoordinate) && !isValidMapCoordinate(stop.coordinate)) {
      showAppAlert(
        'Directions unavailable',
        'Pickup coordinates are not available yet for this rider.',
      );
      return;
    }
    const dest = isValidMapCoordinate(pickupCoordinate)
      ? pickupCoordinate
      : stop.coordinate;
    const originPart = isValidMapCoordinate(driverCoordinate)
      ? `&origin=${driverCoordinate.latitude},${driverCoordinate.longitude}`
      : '';
    const mapsUrl =
      'https://www.google.com/maps/dir/?api=1' +
      originPart +
      `&destination=${dest.latitude},${dest.longitude}` +
      '&travelmode=driving';
    void Linking.openURL(mapsUrl).catch(() => {
      showAppAlert('Google Maps', 'Unable to open Google Maps on this device.');
    });
  }, [driverCoordinate, pickupCoordinate, stop.coordinate]);

  const resetOtp = useCallback(() => {
    setOtpValueState('');
    setOtpError(null);
    setOtpVerifying(false);
  }, []);

  const setOtpValue = useCallback((value: string) => {
    setOtpValueState(value.replace(/[^0-9]/g, '').slice(0, DRIVER_PICKUP_SCREEN.otpLength));
    setOtpError(null);
  }, []);

  const requestRiderOtp = useCallback(() => {
    if (confirming || otpVisible || stops.length === 0 || otpRequestInFlightRef.current) {
      return;
    }

    if (!usesBackendPickup || stop.id === 'empty' || !stop.id.trim()) {
      return;
    }

    otpRequestInFlightRef.current = true;
    resetOtp();

    const bookingId = stop.id.trim();
    const cachedBooking = bookingQueueRef.current.find(
      (row) => resolveBookingRecordId(row) === bookingId,
    );

    if (cachedBooking && isPickupCompleted(cachedBooking)) {
      showAppAlert(
        TRIP_LIFECYCLE_COPY.allPickedUpTitle,
        'This passenger was already picked up.',
      );
      void refreshPassengers();
      otpRequestInFlightRef.current = false;
      return;
    }

    setOtpVisible(true);
    otpRequestInFlightRef.current = false;
  }, [
    confirming,
    otpVisible,
    refreshPassengers,
    resetOtp,
    stop.id,
    stops.length,
    usesBackendPickup,
  ]);

  const closeOtp = useCallback(() => {
    setOtpVisible(false);
    setConfirming(false);
    resetOtp();
    setSwipeEpoch((prev) => prev + 1);
  }, [resetOtp]);

  const continueAfterConfirmed = useCallback(() => {
    setConfirmedVisible(false);
    setConfirming(false);

    if (usesBackendPickup) {
      void (async () => {
        try {
          const { nextIndex, waitingCount } = await refreshPassengers();
          if (nextIndex < 0 || waitingCount === 0) {
            router.replace(
              getDriverActiveTripPath({
                rideType,
                rideId,
                destination,
              }),
            );
            return;
          }
          resetOtp();
          setSwipeEpoch((prev) => prev + 1);
        } catch (error) {
          showAppAlert(
            TRIP_LIFECYCLE_COPY.otpFailedTitle,
            mapLifecycleError(error, 'Could not refresh passengers. Please try again.'),
          );
          setSwipeEpoch((prev) => prev + 1);
        }
      })();
      return;
    }

    resetOtp();
    setSwipeEpoch((prev) => prev + 1);
  }, [
    destination,
    refreshPassengers,
    resetOtp,
    rideId,
    rideType,
    router,
    usesBackendPickup,
  ]);

  const verifyOtp = useCallback(() => {
    if (otpVerifying) {
      return;
    }

    if (otpValue.length !== DRIVER_PICKUP_SCREEN.otpLength) {
      setOtpError(DRIVER_PICKUP_SCREEN.otpInvalidMessage);
      return;
    }

    if (!usesBackendPickup || stop.id === 'empty') {
      return;
    }

    setOtpVerifying(true);
    void (async () => {
      try {
        await verifyPickupById(stop.id, { otp: otpValue });
        await refreshPassengers();
        setOtpVisible(false);
        setOtpVerifying(false);
        setConfirming(true);
        setConfirmedVisible(true);
      } catch (error) {
        setOtpVerifying(false);
        if (isApiError(error) && error.status === 401) {
          authSession.clear();
          router.replace(ROUTES.welcome);
          return;
        }
        const message = mapLifecycleError(
          error,
          TRIP_LIFECYCLE_COPY.otpInvalidMessage,
        );
        setOtpError(message);
        showAppAlert(TRIP_LIFECYCLE_COPY.otpFailedTitle, message);
        try {
          await refreshPassengers();
        } catch {
          // Best-effort refresh after 400/409.
        }
      }
    })();
  }, [
    otpValue,
    otpVerifying,
    refreshPassengers,
    router,
    stop.id,
    usesBackendPickup,
  ]);

  return {
    stop,
    stopTitle,
    confirming,
    requiresOtp,
    otpVisible,
    otpValue,
    otpError,
    otpVerifying,
    confirmedVisible,
    isLastStop,
    swipeResetKey,
    loadingPassengers,
    driverCoordinate,
    routeCoordinates,
    etaLabel,
    distanceLabel,
    requestRiderOtp,
    setOtpValue,
    verifyOtp,
    closeOtp,
    continueAfterConfirmed,
    goBack,
    openNotifications,
    openGoogleMaps,
  };
};
