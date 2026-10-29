import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Share, type AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useGetRideTrackingQuery } from '@/services/api';
import {
  trackingSocket,
  type TrackingConnectionStatus,
} from '@/services/realtime';
import {
  bearingDegrees,
  estimateDurationMinutes,
  ensureRideCoords,
  formatDistanceKmLabel,
  formatEtaLabel,
  haversineDistanceKm,
  isValidMapCoordinate,
  useDeviceLocation,
} from '@/shared/maps';
import { rideVehicleCache } from '../utils/rideVehicleCache';
import { resolveDriverContactPhone } from '../utils/bookingContactPhone';
import { openPhoneCall } from '@/shared/utils';
import { showAppAlert } from '@/store';

import {
  getBookingById,
  getPublicRideById,
  mapBookingToBookedRideDetails,
  resolveBookingRideId,
  resolveDriverDisplayName,
  type BookingResponseDto,
} from '../api';
import {
  bookingVehicleFromPublicRide,
  hasBookingVehicleSnapshot,
  resolveBookingVehicleLabel,
  resolveVehicleLabelForRide,
  resolveVehiclePlateForRide,
  vehicleSnapshotFromRideId,
} from '../utils/bookingVehicle';
import {
  getDriverChatPath,
  getLiveTrackingMock,
  getOngoingTripPath,
  getTripCompletedPath,
  LIVE_TRACKING_SCREEN,
} from '../constants';
import { fetchDrivingRoute } from '../services';
import { tripStartedStore } from '../store';
import type { LiveTrackingData, MapCoordinate, RideType } from '../types';
import {
  classifyRiderLocationFreshness,
  isNewerLocationTimestamp,
  RIDER_LOCATION_STALE_MS,
  type RiderLocationFreshness,
} from '../utils/liveTrackingFreshness';

const REGULAR_RIDE_IN_PROGRESS = 'IN_PROGRESS';
/** Booking status poll — keep moderate; unstable effect deps previously flooded the API. */
const BOOKING_POLL_MS = 5000;
/** Poll REST until socket is LIVE (passenger waiting for first driver fix). */
const TRACKING_INITIAL_POLL_MS = 3000;

/** Passenger-owned booking OTP only — never invent from booking id. */
const extractBookingOtp = (booking: Record<string, unknown>): string => {
  const value = booking.pickupOtp;
  if (typeof value === 'string' && /^\d{4}$/.test(value.trim())) {
    return value.trim();
  }
  return '';
};

const isPickupVerifiedBooking = (booking: BookingResponseDto): boolean => {
  const pickupStatus = String(booking.pickupStatus ?? '').toUpperCase();
  if (
    pickupStatus === 'PICKED_UP' ||
    pickupStatus === 'VERIFIED' ||
    pickupStatus === 'COMPLETED'
  ) {
    return true;
  }
  return Boolean(booking.pickupVerifiedAt);
};

const toMapCoordinate = (
  latitude: number,
  longitude: number,
): MapCoordinate | null => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (latitude === 0 && longitude === 0) {
    return null;
  }
  return { latitude, longitude };
};

export interface UseLiveTrackingParams {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  plateNumber?: string;
  price?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  /** Passenger booking id — Regular lifecycle uses backend ride status when set. */
  bookingId?: string;
}

export interface UseLiveTrackingResult {
  tracking: LiveTrackingData;
  routeCoordinates: MapCoordinate[];
  /** Live driver GPS from socket / REST; null until the first update arrives. */
  driverCoordinate: MapCoordinate | null;
  /** Real GPS heading when provided by backend; otherwise null. */
  driverHeading: number | null;
  /** Rider device GPS (fallback: pickup pin). */
  riderCoordinate: MapCoordinate | null;
  /** Socket / connection UX for Regular live tracking. */
  connectionStatus: TrackingConnectionStatus;
  /** WAITING vs STALE vs LIVE for the driver pin. */
  locationFreshness: RiderLocationFreshness;
  /** ISO timestamp of the last applied driver coordinate. */
  lastLocationUpdatedAt: string | null;
  /** Last tracking:error message from backend (Regular only). */
  trackingError: string | null;
  otpDigits: string[];
  /** Map shows after driver Start Ride (backend IN_PROGRESS for Regular). */
  isRideStarted: boolean;
  /** True after driver verifies rider pickup OTP. */
  isPickupVerified: boolean;
  /** Show OTP until pickup is verified (Start Ride alone does not hide it). */
  showPickupOtp: boolean;
  goBack: () => void;
  openNotifications: () => void;
  shareTrip: () => void;
  explainOtp: () => void;
  openOngoingTrip: () => void;
  callDriver: () => void;
  chatDriver: () => void;
  openSupport: () => void;
}

export const useLiveTracking = (params: UseLiveTrackingParams): UseLiveTrackingResult => {
  const router = useRouter();
  const bookingId = params.bookingId?.trim() || '';
  const isRegular = params.rideType === 'regular';
  /** Regular + Assured: poll passenger booking when bookingId is present. */
  const useBackendLifecycle = bookingId.length > 0;
  /** Socket.IO + REST live tracking when a real booking id is present. */
  const useSocketTracking = useBackendLifecycle;

  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [routeEtaMinutes, setRouteEtaMinutes] = useState(0);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [backendRideInProgress, setBackendRideInProgress] = useState(false);
  const [backendPickupVerified, setBackendPickupVerified] = useState(false);
  const [backendOtp, setBackendOtp] = useState('');
  const [bookingSnapshot, setBookingSnapshot] = useState<BookingResponseDto | null>(null);
  const [assuredSessionStarted, setAssuredSessionStarted] = useState(() =>
    !isRegular ? tripStartedStore.isStarted(params.rideId) : false,
  );
  const [socketStatus, setSocketStatus] = useState<TrackingConnectionStatus>('OFFLINE');
  const [socketCoordinate, setSocketCoordinate] = useState<MapCoordinate | null>(null);
  const [socketHeading, setSocketHeading] = useState<number | null>(null);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null);
  const [freshnessNow, setFreshnessNow] = useState(() => Date.now());
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [resolvedPickup, setResolvedPickup] = useState<MapCoordinate | null>(null);
  const [resolvedDropoff, setResolvedDropoff] = useState<MapCoordinate | null>(null);
  const [publicRideVehicle, setPublicRideVehicle] = useState<
    BookingResponseDto['vehicle'] | null
  >(null);
  const [computedHeading, setComputedHeading] = useState<number | null>(null);
  const prevDriverRef = useRef<MapCoordinate | null>(null);
  const locationUpdatedAtRef = useRef<string | null>(null);
  const navigatingCompletedRef = useRef(false);
  const bookingSnapshotRef = useRef<BookingResponseDto | null>(null);
  const navigateToTripCompletedRef = useRef<() => void>(() => undefined);

  /** Backend IN_PROGRESS when bookingId is set (Regular + Assured). */
  const isRideStarted = useBackendLifecycle
    ? backendRideInProgress
    : isRegular
      ? false
      : assuredSessionStarted;
  const isPickupVerified = useBackendLifecycle
    ? backendPickupVerified
    : assuredSessionStarted;

  const { coordinate: deviceCoordinate } = useDeviceLocation({
    watch: true,
    enabled: isRideStarted,
    timeIntervalMs: 5000,
    distanceIntervalMeters: 20,
  });

  const socketLive =
    useSocketTracking && isRideStarted && socketStatus === 'LIVE';

  const {
    data: rideTracking,
    refetch: refetchRideTracking,
  } = useGetRideTrackingQuery(params.rideId, {
    skip: !params.rideId || !isRideStarted,
    /**
     * Assured: keep continuous REST polling (unchanged behavior).
     * Regular: socket is primary; poll faster until driver GPS, then slower fallback.
     */
    pollingInterval: !useSocketTracking
      ? 3000
      : socketLive
        ? 0
        : TRACKING_INITIAL_POLL_MS,
  });

  const restCoordinate = useMemo<MapCoordinate | null>(() => {
    const location = rideTracking?.location;
    if (!location) {
      return null;
    }
    return toMapCoordinate(Number(location.latitude), Number(location.longitude));
  }, [rideTracking?.location]);

  const restUpdatedAt = rideTracking?.location?.updatedAt ?? null;
  const restHeading =
    rideTracking?.location?.heading != null &&
    Number.isFinite(rideTracking.location.heading)
      ? Number(rideTracking.location.heading)
      : null;

  /**
   * Prefer the freshest sample (socket vs REST) by timestamp.
   * Backend already returns coordinates on GET /tracking/rides/:id — do not wait for socket LIVE.
   */
  const driverCoordinate = useMemo<MapCoordinate | null>(() => {
    const socketOk = isValidMapCoordinate(socketCoordinate);
    const restOk = isValidMapCoordinate(restCoordinate);
    if (socketOk && restOk) {
      const socketAt = locationUpdatedAt ? new Date(locationUpdatedAt).getTime() : 0;
      const restAt = restUpdatedAt ? new Date(restUpdatedAt).getTime() : 0;
      return restAt > socketAt ? restCoordinate : socketCoordinate;
    }
    if (socketOk) {
      return socketCoordinate;
    }
    return restCoordinate;
  }, [locationUpdatedAt, restCoordinate, restUpdatedAt, socketCoordinate]);

  const driverHeading = useMemo(() => {
    if (socketHeading != null && Number.isFinite(socketHeading)) {
      return socketHeading;
    }
    if (restHeading != null) {
      return restHeading;
    }
    return computedHeading;
  }, [computedHeading, restHeading, socketHeading]);

  useEffect(() => {
    if (!isValidMapCoordinate(driverCoordinate)) {
      return;
    }
    console.log('[LiveLocation][passenger] driver pin', {
      rideId: params.rideId,
      latitude: driverCoordinate.latitude,
      longitude: driverCoordinate.longitude,
      source: isValidMapCoordinate(socketCoordinate) ? 'socket|rest' : 'rest',
      restHit: Boolean(restCoordinate),
      socketHit: Boolean(socketCoordinate),
    });
    const prev = prevDriverRef.current;
    if (isValidMapCoordinate(prev)) {
      const movedM = haversineDistanceKm(prev, driverCoordinate) * 1000;
      if (movedM >= 8) {
        setComputedHeading(bearingDegrees(prev, driverCoordinate));
      }
    }
    prevDriverRef.current = driverCoordinate;
  }, [
    driverCoordinate,
    params.rideId,
    restCoordinate,
    socketCoordinate,
  ]);

  const lastLocationUpdatedAt = locationUpdatedAt ?? restUpdatedAt;

  const locationFreshness = useMemo<RiderLocationFreshness>(
    () =>
      classifyRiderLocationFreshness({
        rideStarted: isRideStarted,
        hasCoordinate: Boolean(driverCoordinate),
        updatedAt: lastLocationUpdatedAt,
        nowMs: freshnessNow,
        staleMs: RIDER_LOCATION_STALE_MS,
        trackingError,
      }),
    [
      driverCoordinate,
      freshnessNow,
      isRideStarted,
      lastLocationUpdatedAt,
      trackingError,
    ],
  );

  const connectionStatus = useMemo<TrackingConnectionStatus>(() => {
    if (!useSocketTracking || !isRideStarted) {
      return 'OFFLINE';
    }
    if (socketStatus === 'COMPLETED') {
      return 'COMPLETED';
    }
    if (socketStatus === 'ERROR' && !driverCoordinate) {
      return 'ERROR';
    }
    if (locationFreshness === 'STALE') {
      return 'STALE';
    }
    if (driverCoordinate) {
      return socketStatus === 'LIVE' ? 'LIVE' : 'CONNECTED';
    }
    return socketStatus;
  }, [
    driverCoordinate,
    isRideStarted,
    locationFreshness,
    socketStatus,
    useSocketTracking,
  ]);

  useEffect(() => {
    locationUpdatedAtRef.current = lastLocationUpdatedAt;
  }, [lastLocationUpdatedAt]);

  useEffect(() => {
    if (!useSocketTracking || !isRideStarted) {
      return;
    }
    const timer = setInterval(() => {
      setFreshnessNow(Date.now());
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [isRideStarted, useSocketTracking]);

  const navigateAfterTripCompletion = useCallback(
    async (bookingHint?: BookingResponseDto | null) => {
      if (navigatingCompletedRef.current) {
        return;
      }
      navigatingCompletedRef.current = true;

      if (useSocketTracking && params.rideId) {
        trackingSocket.leaveRide(params.rideId);
      }

      let booking = bookingHint ?? bookingSnapshotRef.current;
      if (!booking && bookingId) {
        try {
          booking = await getBookingById(bookingId);
        } catch (error) {
          console.log('[LiveTracking] completion booking fetch failed', error);
        }
      }

      const rideId = booking ? resolveBookingRideId(booking) : params.rideId;
      const driverName = booking
        ? resolveDriverDisplayName(booking) || params.driverName
        : params.driverName;
      const tripCompletedParams = {
        rideId,
        rideType: params.rideType,
        origin: params.origin,
        destination: params.destination,
        driverName,
        carModel: params.carModel,
        price: params.price,
        originLat: params.originLat,
        originLng: params.originLng,
        destinationLat: params.destinationLat,
        destinationLng: params.destinationLng,
        bookingId: booking?.id || bookingId || undefined,
      };

      if (!rideId?.trim()) {
        router.replace(getTripCompletedPath(tripCompletedParams));
        return;
      }

      // Always land on trip-completed first so PAY_LATER riders choose
      // wallet vs cash before rating. Trip-completed auto-forwards to
      // review when settlement is not eligible.
      router.replace(getTripCompletedPath(tripCompletedParams));
    },
    [
      bookingId,
      params.carModel,
      params.destination,
      params.destinationLat,
      params.destinationLng,
      params.driverName,
      params.origin,
      params.originLat,
      params.originLng,
      params.price,
      params.rideId,
      params.rideType,
      router,
      useSocketTracking,
    ],
  );

  navigateToTripCompletedRef.current = () => {
    void navigateAfterTripCompletion();
  };

  /** Socket.IO: connect → auth (JWT) → join → listen while ride is IN_PROGRESS. */
  useEffect(() => {
    if (!useSocketTracking || !isRideStarted || !params.rideId) {
      return;
    }

    const rideId = params.rideId;
    trackingSocket.joinRide(rideId);
    const unsubStatus = trackingSocket.subscribeStatus((status) => {
      setSocketStatus(status);
      if (status === 'CONNECTED' || status === 'LIVE') {
        setTrackingError(null);
      }
    });
    const unsubLocation = trackingSocket.subscribeLocation((payload) => {
      if (payload.rideId !== rideId) {
        return;
      }
      const next = toMapCoordinate(payload.latitude, payload.longitude);
      if (!next) {
        return;
      }
      const stamp = payload.updatedAt ?? payload.timestamp ?? new Date().toISOString();
      if (!isNewerLocationTimestamp(stamp, locationUpdatedAtRef.current)) {
        return;
      }
      locationUpdatedAtRef.current = stamp;
      setSocketCoordinate(next);
      setSocketHeading(
        payload.heading != null && Number.isFinite(payload.heading)
          ? payload.heading
          : null,
      );
      setLocationUpdatedAt(stamp);
      console.log('[LiveLocation][passenger] socket', {
        rideId,
        latitude: next.latitude,
        longitude: next.longitude,
        updatedAt: stamp,
      });
    });
    const unsubEnded = trackingSocket.subscribeEnded((payload) => {
      if (payload.rideId && payload.rideId !== rideId) {
        return;
      }
      navigateToTripCompletedRef.current();
    });
    const unsubError = trackingSocket.subscribeError((payload) => {
      setTrackingError(payload.message);
    });

    void refetchRideTracking();

    return () => {
      unsubStatus();
      unsubLocation();
      unsubEnded();
      unsubError();
      trackingSocket.leaveRide(rideId);
    };
  }, [isRideStarted, params.rideId, refetchRideTracking, useSocketTracking]);

  /** Seed / refresh from REST when socket reconnects, goes offline, or app foregrounds. */
  useEffect(() => {
    if (!useSocketTracking || !isRideStarted) {
      return;
    }
    if (
      socketStatus === 'RECONNECTING' ||
      socketStatus === 'OFFLINE' ||
      socketStatus === 'CONNECTING'
    ) {
      void refetchRideTracking();
    }
  }, [isRideStarted, refetchRideTracking, socketStatus, useSocketTracking]);

  useEffect(() => {
    if (!useSocketTracking || !isRideStarted) {
      return;
    }
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void refetchRideTracking();
        trackingSocket.joinRide(params.rideId);
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [isRideStarted, params.rideId, refetchRideTracking, useSocketTracking]);

  /** Apply REST sample when socket has no fresher point (initial / reconnect / fallback). */
  useEffect(() => {
    if (!useSocketTracking || !restCoordinate) {
      return;
    }
    const restAt = restUpdatedAt ? new Date(restUpdatedAt).getTime() : 0;
    const socketAt = locationUpdatedAt ? new Date(locationUpdatedAt).getTime() : 0;
    if (socketStatus === 'LIVE' && socketCoordinate && socketAt >= restAt) {
      return;
    }
    if (!socketCoordinate || restAt >= socketAt) {
      if (
        restUpdatedAt &&
        !isNewerLocationTimestamp(restUpdatedAt, locationUpdatedAtRef.current) &&
        socketCoordinate
      ) {
        return;
      }
      setSocketCoordinate(restCoordinate);
      if (restUpdatedAt) {
        locationUpdatedAtRef.current = restUpdatedAt;
        setLocationUpdatedAt(restUpdatedAt);
      }
    }
  }, [
    locationUpdatedAt,
    restCoordinate,
    restUpdatedAt,
    socketCoordinate,
    socketStatus,
    useSocketTracking,
  ]);

  const paramPickupCoordinate = useMemo<MapCoordinate | null>(() => {
    if (
      params.originLat != null &&
      params.originLng != null &&
      Number.isFinite(params.originLat) &&
      Number.isFinite(params.originLng)
    ) {
      return { latitude: params.originLat, longitude: params.originLng };
    }
    return null;
  }, [params.originLat, params.originLng]);

  const paramDropoffCoordinate = useMemo<MapCoordinate | null>(() => {
    if (
      params.destinationLat != null &&
      params.destinationLng != null &&
      Number.isFinite(params.destinationLat) &&
      Number.isFinite(params.destinationLng)
    ) {
      return { latitude: params.destinationLat, longitude: params.destinationLng };
    }
    return null;
  }, [params.destinationLat, params.destinationLng]);

  /** Resolve pickup/drop-off from ride cache or geocode when route params omit lat/lng. */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { origin, destination } = await ensureRideCoords({
        rideId: params.rideId,
        originAddress: params.origin ?? bookingSnapshot?.ride?.source ?? null,
        destinationAddress: params.destination ?? bookingSnapshot?.ride?.destination ?? null,
        origin: paramPickupCoordinate,
        destination: paramDropoffCoordinate,
      });
      if (cancelled) {
        return;
      }
      setResolvedPickup(origin);
      setResolvedDropoff(destination);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    bookingSnapshot?.ride?.destination,
    bookingSnapshot?.ride?.source,
    paramDropoffCoordinate,
    paramPickupCoordinate,
    params.destination,
    params.origin,
    params.rideId,
  ]);

  const pickupCoordinate = useMemo<MapCoordinate | null>(() => {
    if (isValidMapCoordinate(paramPickupCoordinate)) {
      return paramPickupCoordinate;
    }
    if (isValidMapCoordinate(resolvedPickup)) {
      return resolvedPickup;
    }
    return null;
  }, [paramPickupCoordinate, resolvedPickup]);

  const dropoffCoordinate = useMemo<MapCoordinate | null>(() => {
    if (isValidMapCoordinate(paramDropoffCoordinate)) {
      return paramDropoffCoordinate;
    }
    if (isValidMapCoordinate(resolvedDropoff)) {
      return resolvedDropoff;
    }
    return null;
  }, [paramDropoffCoordinate, resolvedDropoff]);

  const riderCoordinate = useMemo<MapCoordinate | null>(() => {
    if (isValidMapCoordinate(deviceCoordinate)) {
      return deviceCoordinate;
    }
    return pickupCoordinate;
  }, [deviceCoordinate, pickupCoordinate]);

  /** Booking snapshot may omit vehicle — use on-device cache, then public ride API. */
  useEffect(() => {
    if ((!isRegular && !useBackendLifecycle) || !params.rideId.trim()) {
      setPublicRideVehicle(null);
      return;
    }
    if (hasBookingVehicleSnapshot(bookingSnapshot?.vehicle ?? null)) {
      setPublicRideVehicle(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      await rideVehicleCache.hydrate();
      if (cancelled) {
        return;
      }
      const cached = vehicleSnapshotFromRideId(params.rideId);
      if (cached) {
        setPublicRideVehicle(cached);
        return;
      }

      try {
        const ride = await getPublicRideById(params.rideId);
        if (cancelled || !ride?.vehicle) {
          return;
        }
        const snapshot = bookingVehicleFromPublicRide(ride.vehicle);
        setPublicRideVehicle(snapshot);
        await rideVehicleCache.save({
          rideId: params.rideId,
          vehicleLabel: resolveBookingVehicleLabel(ride.vehicle),
          make: ride.vehicle.make,
          model: ride.vehicle.model,
          color: ride.vehicle.color ?? undefined,
        });
      } catch (error) {
        console.log('[LiveTracking] getPublicRideById vehicle fallback failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingSnapshot?.vehicle, isRegular, params.rideId, useBackendLifecycle]);

  const resolvedVehicle = useMemo(() => {
    const bookingVehicle = bookingSnapshot?.vehicle ?? publicRideVehicle;
    const label = resolveVehicleLabelForRide(
      params.rideId,
      bookingVehicle,
      params.carModel,
    );
    const plate =
      resolveVehiclePlateForRide(params.rideId, bookingVehicle) ||
      params.plateNumber?.trim() ||
      '';

    return {
      label: label !== LIVE_TRACKING_SCREEN.defaultVehicle ? label : params.carModel?.trim() || label,
      plate,
    };
  }, [
    bookingSnapshot?.vehicle,
    params.carModel,
    params.plateNumber,
    publicRideVehicle,
  ]);

  const tracking = useMemo((): LiveTrackingData => {
    const details = bookingSnapshot
      ? mapBookingToBookedRideDetails(bookingSnapshot, {
          origin: params.origin,
          destination: params.destination,
          driverName: params.driverName,
          carModel: params.carModel,
          plateNumber: params.plateNumber,
        })
      : null;

    if (isRegular || useBackendLifecycle) {
      const driverName =
        (details?.driverName && details.driverName !== 'Driver' ? details.driverName : '') ||
        (bookingSnapshot ? resolveDriverDisplayName(bookingSnapshot) : '') ||
        params.driverName?.trim() ||
        LIVE_TRACKING_SCREEN.defaultDriverName;

      const vehicleLabel =
        (details?.vehicle && details.vehicle !== LIVE_TRACKING_SCREEN.defaultVehicle
          ? details.vehicle
          : '') ||
        (details?.driverSubtitle && details.driverSubtitle !== LIVE_TRACKING_SCREEN.defaultVehicle
          ? details.driverSubtitle
          : '') ||
        resolvedVehicle.label ||
        params.carModel?.trim() ||
        LIVE_TRACKING_SCREEN.defaultVehicle;

      const fareAmount =
        details?.fareTotal ??
        (params.price != null && Number.isFinite(params.price) ? params.price : 0);
      const fareLabel = fareAmount > 0 ? `₹${Math.round(fareAmount)}` : '';

      const pickup = pickupCoordinate ?? { latitude: 0, longitude: 0 };
      const dropoff = dropoffCoordinate ?? { latitude: 0, longitude: 0 };
      const etaTarget = isPickupVerified
        ? isValidMapCoordinate(dropoff)
          ? dropoff
          : null
        : isValidMapCoordinate(pickup)
          ? pickup
          : null;

      let etaMinutes = 0;
      let distanceRemainingLabel = '—';

      if (routeEtaMinutes > 0) {
        etaMinutes = routeEtaMinutes;
        if (routeDistanceKm != null) {
          distanceRemainingLabel = formatDistanceKmLabel(routeDistanceKm);
        }
      } else if (
        isValidMapCoordinate(driverCoordinate) &&
        etaTarget &&
        isValidMapCoordinate(etaTarget)
      ) {
        const remainingKm = haversineDistanceKm(driverCoordinate, etaTarget);
        etaMinutes = estimateDurationMinutes(remainingKm);
        distanceRemainingLabel = formatDistanceKmLabel(remainingKm);
      }

      const driverPhone = bookingSnapshot
        ? resolveDriverContactPhone(bookingSnapshot) || null
        : null;

      return {
        rideId: params.rideId,
        rideType: params.rideType,
        statusLabel: isPickupVerified
          ? LIVE_TRACKING_SCREEN.etaLabelTrip
          : LIVE_TRACKING_SCREEN.etaLabelArrival,
        etaMinutes,
        etaLabel: etaMinutes > 0 ? formatEtaLabel(etaMinutes) : '—',
        distanceRemainingLabel,
        fareLabel,
        startOtp: isPickupVerified ? '' : backendOtp,
        driver: {
          name: driverName,
          vehicleLabel,
          plateNumber: details?.plateNumber || resolvedVehicle.plate || '',
          rating: LIVE_TRACKING_SCREEN.defaultRating,
          avatarUri: bookingSnapshot?.driver?.profilePhoto?.trim() || undefined,
        },
        driverPhone,
        pickupLabel: 'Pickup',
        pickupAddress: details?.pickup || params.origin?.trim() || 'Pickup',
        dropoffLabel: 'Drop-off',
        dropoffAddress: details?.dropoff || params.destination?.trim() || 'Drop-off',
        pickup,
        dropoff,
      };
    }

    const mock = getLiveTrackingMock({
      rideId: params.rideId,
      rideType: params.rideType,
      origin: params.origin,
      destination: params.destination,
      driverName: params.driverName,
      carModel: params.carModel,
      originLat: params.originLat,
      originLng: params.originLng,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
    });

    const driverName =
      (details?.driverName && details.driverName !== 'Driver' ? details.driverName : '') ||
      (bookingSnapshot ? resolveDriverDisplayName(bookingSnapshot) : '') ||
      params.driverName?.trim() ||
      mock.driver.name;

    const vehicleLabel =
      (details?.vehicle && details.vehicle !== LIVE_TRACKING_SCREEN.defaultVehicle
        ? details.vehicle
        : '') ||
      (details?.driverSubtitle && details.driverSubtitle !== LIVE_TRACKING_SCREEN.defaultVehicle
        ? details.driverSubtitle
        : '') ||
      resolvedVehicle.label ||
      mock.driver.vehicleLabel;

    const fareAmount =
      details?.fareTotal ??
      (params.price != null && Number.isFinite(params.price) ? params.price : 0);
    const fareLabel = fareAmount > 0 ? `₹${Math.round(fareAmount)}` : mock.fareLabel;

    const pickup = pickupCoordinate ?? mock.pickup;
    const dropoff = dropoffCoordinate ?? mock.dropoff;
    const etaTarget = isPickupVerified ? dropoff : pickup;

    let etaMinutes = 0;
    let distanceRemainingLabel = '—';

    if (routeEtaMinutes > 0) {
      etaMinutes = routeEtaMinutes;
      if (routeDistanceKm != null) {
        distanceRemainingLabel = formatDistanceKmLabel(routeDistanceKm);
      }
    } else if (isValidMapCoordinate(driverCoordinate) && isValidMapCoordinate(etaTarget)) {
      const remainingKm = haversineDistanceKm(driverCoordinate, etaTarget);
      etaMinutes = estimateDurationMinutes(remainingKm);
      distanceRemainingLabel = formatDistanceKmLabel(remainingKm);
    }

    const driverPhone = bookingSnapshot
      ? resolveDriverContactPhone(bookingSnapshot) || null
      : null;

    const otpForUi = isPickupVerified ? '' : mock.startOtp;

    return {
      ...mock,
      pickup,
      dropoff,
      startOtp: otpForUi,
      statusLabel: isPickupVerified
        ? LIVE_TRACKING_SCREEN.etaLabelTrip
        : LIVE_TRACKING_SCREEN.etaLabelArrival,
      etaMinutes,
      etaLabel: etaMinutes > 0 ? formatEtaLabel(etaMinutes) : '—',
      distanceRemainingLabel,
      fareLabel,
      pickupAddress: details?.pickup || mock.pickupAddress,
      dropoffAddress: details?.dropoff || mock.dropoffAddress,
      driver: {
        ...mock.driver,
        name: driverName,
        vehicleLabel,
        plateNumber: details?.plateNumber || resolvedVehicle.plate || mock.driver.plateNumber,
        avatarUri:
          bookingSnapshot?.driver?.profilePhoto?.trim() || mock.driver.avatarUri,
      },
      driverPhone,
    };
  }, [
    backendOtp,
    bookingSnapshot,
    driverCoordinate,
    dropoffCoordinate,
    isPickupVerified,
    pickupCoordinate,
    resolvedVehicle,
    routeDistanceKm,
    routeEtaMinutes,
    params.carModel,
    params.destination,
    params.destinationLat,
    params.destinationLng,
    params.driverName,
    params.origin,
    params.originLat,
    params.originLng,
    params.plateNumber,
    params.price,
    params.rideId,
    params.rideType,
    isRegular,
    useBackendLifecycle,
  ]);

  const otpDigits = useMemo(() => {
    if (!tracking.startOtp) {
      return ['', '', '', ''];
    }
    return tracking.startOtp.padEnd(4, ' ').slice(0, 4).split('');
  }, [tracking.startOtp]);

  useEffect(() => {
    if (useBackendLifecycle || isRegular) {
      return;
    }
    setAssuredSessionStarted(tripStartedStore.isStarted(params.rideId));
    return tripStartedStore.subscribe(() => {
      setAssuredSessionStarted(tripStartedStore.isStarted(params.rideId));
    });
  }, [isRegular, params.rideId, useBackendLifecycle]);

  useEffect(() => {
    if (!useBackendLifecycle) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const booking = await getBookingById(bookingId);
        if (cancelled) {
          return;
        }
        const rideStatus = String(booking.ride?.status ?? '').toUpperCase();
        const bookingStatus = String(booking.status ?? '').toUpperCase();
        const pickupVerified = isPickupVerifiedBooking(booking);
        setBookingSnapshot(booking);
        bookingSnapshotRef.current = booking;
        setBackendRideInProgress(rideStatus === REGULAR_RIDE_IN_PROGRESS);
        setBackendPickupVerified(pickupVerified);
        setBackendOtp(
          pickupVerified
            ? ''
            : extractBookingOtp(booking as unknown as Record<string, unknown>),
        );

        if (rideStatus === 'COMPLETED' || bookingStatus === 'COMPLETED') {
          void navigateAfterTripCompletion(booking);
        }
      } catch (error) {
        console.log('[LiveTracking] getBookingById failed', error);
      }
    };

    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, BOOKING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId, navigateAfterTripCompletion, useBackendLifecycle]);

  useEffect(() => {
    if (!isRideStarted) {
      setRouteCoordinates([]);
      setRouteEtaMinutes(0);
      setRouteDistanceKm(null);
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      const routePickup = isValidMapCoordinate(pickupCoordinate) ? pickupCoordinate : null;
      const routeDropoff = isValidMapCoordinate(dropoffCoordinate) ? dropoffCoordinate : null;

      if (!isPickupVerified) {
        if (!isValidMapCoordinate(driverCoordinate)) {
          if (!cancelled) {
            setRouteCoordinates([]);
            setRouteEtaMinutes(0);
            setRouteDistanceKm(null);
          }
          return;
        }

        /** Blue route: driver live GPS → booked pickup (fallback: rider GPS). */
        const mapDestination = routePickup ?? riderCoordinate;

        if (!isValidMapCoordinate(mapDestination)) {
          if (!cancelled) {
            setRouteCoordinates([]);
            setRouteEtaMinutes(0);
            setRouteDistanceKm(null);
          }
          return;
        }

        try {
          /** One Google/OSRM route for both polyline + ETA — same numbers as Maps. */
          const route = await fetchDrivingRoute(driverCoordinate, mapDestination);
          if (cancelled) {
            return;
          }
          const mapCoords =
            route.coordinates.length >= 2
              ? route.coordinates
              : [driverCoordinate, mapDestination];
          setRouteCoordinates(mapCoords);
          setRouteEtaMinutes(
            Number.isFinite(route.durationMinutes)
              ? Math.max(1, Math.round(route.durationMinutes))
              : 0,
          );
          setRouteDistanceKm(
            Number.isFinite(route.distanceKm) ? route.distanceKm : null,
          );
        } catch {
          if (!cancelled) {
            setRouteCoordinates([driverCoordinate, mapDestination]);
            const km = haversineDistanceKm(driverCoordinate, mapDestination);
            setRouteEtaMinutes(estimateDurationMinutes(km));
            setRouteDistanceKm(km);
          }
        }
        return;
      }

      const origin = driverCoordinate;
      const destination = routeDropoff;

      if (!isValidMapCoordinate(origin) || !isValidMapCoordinate(destination)) {
        if (!cancelled) {
          setRouteCoordinates([]);
          setRouteEtaMinutes(0);
          setRouteDistanceKm(null);
        }
        return;
      }

      try {
        const route = await fetchDrivingRoute(origin, destination);
        if (cancelled) {
          return;
        }
        if (route.coordinates.length >= 2) {
          setRouteCoordinates(route.coordinates);
        } else {
          setRouteCoordinates([origin, destination]);
        }
        setRouteEtaMinutes(
          Number.isFinite(route.durationMinutes)
            ? Math.max(1, Math.round(route.durationMinutes))
            : 0,
        );
        setRouteDistanceKm(
          Number.isFinite(route.distanceKm) ? route.distanceKm : null,
        );
      } catch {
        if (!cancelled) {
          setRouteCoordinates([origin, destination]);
          const km = haversineDistanceKm(origin, destination);
          setRouteEtaMinutes(estimateDurationMinutes(km));
          setRouteDistanceKm(km);
        }
      }
    };

    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    driverCoordinate,
    dropoffCoordinate,
    isPickupVerified,
    isRideStarted,
    pickupCoordinate,
    riderCoordinate,
  ]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.rideSearchBooked);
  }, [router]);

  const openNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const shareTrip = useCallback(() => {
    const includeOtp = !isPickupVerified && Boolean(tracking.startOtp);
    const message = LIVE_TRACKING_SCREEN.shareTripMessage(
      tracking.driver.name,
      tracking.etaLabel,
      includeOtp ? tracking.startOtp || undefined : undefined,
    );
    Share.share({ message }).catch(() => {
      showAppAlert(LIVE_TRACKING_SCREEN.shareTripLabel, message);
    });
  }, [
    isPickupVerified,
    tracking.driver.name,
    tracking.etaLabel,
    tracking.startOtp,
  ]);

  const explainOtp = useCallback(() => {
    showAppAlert(LIVE_TRACKING_SCREEN.whyOtpTitle, LIVE_TRACKING_SCREEN.whyOtpMessage);
  }, []);

  const openOngoingTrip = useCallback(() => {
    if (!isRideStarted) {
      showAppAlert(LIVE_TRACKING_SCREEN.waitingTitle, LIVE_TRACKING_SCREEN.waitingMessage);
      return;
    }

    router.push(
      getOngoingTripPath({
        rideId: params.rideId,
        rideType: params.rideType,
        origin: params.origin,
        destination: params.destination,
        driverName: params.driverName,
        carModel: params.carModel,
        price: params.price,
        originLat: params.originLat,
        originLng: params.originLng,
        destinationLat: params.destinationLat,
        destinationLng: params.destinationLng,
        bookingId: bookingId || undefined,
      }),
    );
  }, [bookingId, isRideStarted, params, router]);

  const callDriver = useCallback(() => {
    const phone = tracking.driverPhone?.trim();
    if (!phone) {
      showAppAlert(
        'Call',
        'Driver phone number is not available on this booking yet.',
      );
      return;
    }
    void openPhoneCall(phone).then((started) => {
      if (!started) {
        showAppAlert('Call', 'Unable to start a call right now.');
      }
    });
  }, [tracking.driverPhone]);

  const chatDriver = useCallback(() => {
    router.push(
      getDriverChatPath({
        driverName: tracking.driver.name,
        carModel: tracking.driver.vehicleLabel.replace(/^White\s+/i, ''),
        bookingId,
        perspective: 'rider',
      }),
    );
  }, [bookingId, router, tracking.driver.name, tracking.driver.vehicleLabel]);

  const openSupport = useCallback(() => {
    router.push(ROUTES.helpSupport);
  }, [router]);

  return {
    tracking,
    routeCoordinates,
    driverCoordinate,
    driverHeading,
    riderCoordinate,
    connectionStatus,
    locationFreshness,
    lastLocationUpdatedAt,
    trackingError,
    otpDigits,
    isRideStarted,
    isPickupVerified,
    showPickupOtp: !isPickupVerified && Boolean(tracking.startOtp),
    goBack,
    openNotifications,
    shareTrip,
    explainOtp,
    openOngoingTrip,
    callDriver,
    chatDriver,
    openSupport,
  };
};
