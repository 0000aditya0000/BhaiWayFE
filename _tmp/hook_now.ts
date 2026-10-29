import { useCallback, useEffect, useMemo, useState } from 'react';
import { showAppAlert } from '@/store';
import { Linking, Share } from 'react-native';

import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { useGetRideTrackingQuery } from '@/services/api';
import {
  getBookingById,
  mapBookingToBookedRideDetails,
  resolveDriverDisplayName,
  type BookingResponseDto,
} from '../api';
import {
  getLiveTrackingMock,
  getDriverChatPath,
  getOngoingTripPath,
  LIVE_TRACKING_SCREEN,
  getTripCompletedPath,
} from '../constants';
import { fetchDrivingRoute } from '../services';
import { tripStartedStore } from '../store';
import type { LiveTrackingData, MapCoordinate, RideType } from '../types';
import {
  estimateDurationMinutes,
  formatDistanceKmLabel,
  formatEtaLabel,
  haversineDistanceKm,
  isValidMapCoordinate,
  useDeviceLocation,
} from '@/shared/maps';

const RIDE_STARTED_STATUSES = new Set(['IN_PROGRESS', 'STARTED', 'ONGOING']);
const POLL_MS = 4000;
/** Backup poll when realtime invalidation is unavailable (cross-device / production). */
const TRACKING_POLL_MS = 3000;

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

export interface UseLiveTrackingParams {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
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
  /** Live driver GPS from tracking API; null until the first update arrives. */
  driverCoordinate: MapCoordinate | null;
  /** Rider device GPS (fallback: pickup pin). */
  riderCoordinate: MapCoordinate | null;
  otpDigits: string[];
  /** Map shows after driver Start Ride (backend IN_PROGRESS for Regular). */
  isRideStarted: boolean;
  /** True after driver verifies rider pickup OTP. */
  isPickupVerified: boolean;
  /** Show OTP until pickup is verified. */
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
  const useBackendLifecycle = params.rideType === 'regular' && bookingId.length > 0;

  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [routeEtaMinutes, setRouteEtaMinutes] = useState(0);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [backendRideStarted, setBackendRideStarted] = useState(false);
  const [backendPickupVerified, setBackendPickupVerified] = useState(false);
  const [backendOtp, setBackendOtp] = useState<string>('');
  const [bookingSnapshot, setBookingSnapshot] = useState<BookingResponseDto | null>(null);
  const [sessionStarted, setSessionStarted] = useState(() =>
    tripStartedStore.isStarted(params.rideId),
  );

  const isRideStarted = useBackendLifecycle ? backendRideStarted : sessionStarted;
  const isPickupVerified = useBackendLifecycle ? backendPickupVerified : sessionStarted;
  const showPickupOtp =
    Boolean(backendOtp) && !isPickupVerified && (!useBackendLifecycle || !isPickupVerified);

  const { coordinate: deviceCoordinate } = useDeviceLocation({
    watch: true,
    enabled: isRideStarted,
    timeIntervalMs: 5000,
    distanceIntervalMeters: 20,
  });

  const { data: rideTracking } = useGetRideTrackingQuery(params.rideId, {
    skip: !params.rideId || !isRideStarted,
    pollingInterval: TRACKING_POLL_MS,
  });

  const driverCoordinate = useMemo<MapCoordinate | null>(() => {
    const location = rideTracking?.location;
    if (!location) {
      return null;
    }
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    if (latitude === 0 && longitude === 0) {
      return null;
    }
    return { latitude, longitude };
  }, [rideTracking?.location]);

  const pickupCoordinate = useMemo<MapCoordinate | null>(() => {
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

  const dropoffCoordinate = useMemo<MapCoordinate | null>(() => {
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

  /** Rider pin: live device GPS preferred, else booking pickup. */
  const riderCoordinate = useMemo<MapCoordinate | null>(() => {
    if (isValidMapCoordinate(deviceCoordinate)) {
      return deviceCoordinate;
    }
    return pickupCoordinate;
  }, [deviceCoordinate, pickupCoordinate]);

  useEffect(() => {
    if (!driverCoordinate) {
      return;
    }
    console.log('[LiveLocation][passenger] received', {
      rideId: params.rideId,
      latitude: driverCoordinate.latitude,
      longitude: driverCoordinate.longitude,
      updatedAt: rideTracking?.location?.updatedAt ?? null,
      isPickupVerified,
    });
  }, [
    driverCoordinate,
    isPickupVerified,
    params.rideId,
    rideTracking?.location?.updatedAt,
  ]);

  const tracking = useMemo(() => {
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

    const details = bookingSnapshot
      ? mapBookingToBookedRideDetails(bookingSnapshot, {
          origin: params.origin,
          destination: params.destination,
          driverName: params.driverName,
          carModel: params.carModel,
        })
      : null;

    const driverName =
      (details?.driverName && details.driverName !== 'Driver' ? details.driverName : '') ||
      (bookingSnapshot ? resolveDriverDisplayName(bookingSnapshot) : '') ||
      params.driverName?.trim() ||
      mock.driver.name;

    const vehicleLabel =
      details?.vehicle || details?.driverSubtitle || mock.driver.vehicleLabel;

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
    } else if (
      !isPickupVerified &&
      isValidMapCoordinate(pickup) &&
      isValidMapCoordinate(dropoff)
    ) {
      // Before driver GPS: rough pickup→dropoff is misleading for arrival ETA — leave blank.
      etaMinutes = 0;
      distanceRemainingLabel = '—';
    }

    const driverPhone =
      bookingSnapshot?.driver?.phone?.trim() ||
      bookingSnapshot?.driver?.phoneNumber?.trim() ||
      bookingSnapshot?.driver?.mobile?.trim() ||
      null;

    const otpForUi =
      useBackendLifecycle && !isPickupVerified ? backendOtp : isPickupVerified ? '' : mock.startOtp;

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
        plateNumber: details?.plateNumber || mock.driver.plateNumber,
        avatarUri:
          bookingSnapshot?.driver?.profilePhoto?.trim() || mock.driver.avatarUri,
      },
      driverPhone,
    } satisfies LiveTrackingData;
  }, [
    backendOtp,
    bookingSnapshot,
    driverCoordinate,
    dropoffCoordinate,
    isPickupVerified,
    pickupCoordinate,
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
    params.price,
    params.rideId,
    params.rideType,
    useBackendLifecycle,
  ]);

  const otpDigits = useMemo(() => {
    if (!tracking.startOtp) {
      return ['', '', '', ''];
    }
    return tracking.startOtp.padEnd(4, ' ').slice(0, 4).split('');
  }, [tracking.startOtp]);

  useEffect(() => {
    if (useBackendLifecycle) {
      return;
    }
    setSessionStarted(tripStartedStore.isStarted(params.rideId));
    return tripStartedStore.subscribe(() => {
      setSessionStarted(tripStartedStore.isStarted(params.rideId));
    });
  }, [params.rideId, useBackendLifecycle]);

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
        const pickupVerified = isPickupVerifiedBooking(booking);
        setBookingSnapshot(booking);
        setBackendRideStarted(RIDE_STARTED_STATUSES.has(rideStatus));
        setBackendPickupVerified(pickupVerified);
        setBackendOtp(
          pickupVerified
            ? ''
            : extractBookingOtp(booking as unknown as Record<string, unknown>),
        );

        if (rideStatus === 'COMPLETED') {
          router.replace(
            getTripCompletedPath({
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
              bookingId,
            }),
          );
        }
      } catch (error) {
        console.log('[LiveTracking] getBookingById failed', error);
      }
    };

    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId, params, router, useBackendLifecycle]);

  useEffect(() => {
    if (!isRideStarted) {
      setRouteCoordinates([]);
      setRouteEtaMinutes(0);
      setRouteDistanceKm(null);
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      const origin = isValidMapCoordinate(driverCoordinate)
        ? driverCoordinate
        : tracking.pickup;
      const destination = isPickupVerified ? tracking.dropoff : tracking.pickup;

      // En-route to rider: need a real driver position for a useful arrival ETA.
      if (!isPickupVerified && !isValidMapCoordinate(driverCoordinate)) {
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
        } else if (isValidMapCoordinate(origin) && isValidMapCoordinate(destination)) {
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
          if (isValidMapCoordinate(origin) && isValidMapCoordinate(destination)) {
            setRouteCoordinates([origin, destination]);
            const km = haversineDistanceKm(origin, destination);
            setRouteEtaMinutes(estimateDurationMinutes(km));
            setRouteDistanceKm(km);
          } else {
            setRouteCoordinates([]);
            setRouteEtaMinutes(0);
            setRouteDistanceKm(null);
          }
        }
      }
    };

    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    driverCoordinate,
    isPickupVerified,
    isRideStarted,
    tracking.dropoff,
    tracking.pickup,
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
    const message = LIVE_TRACKING_SCREEN.shareTripMessage(
      tracking.driver.name,
      tracking.etaLabel,
      showPickupOtp ? tracking.startOtp || undefined : undefined,
    );
    Share.share({ message }).catch(() => {
      showAppAlert(LIVE_TRACKING_SCREEN.shareTripLabel, message);
    });
  }, [
    showPickupOtp,
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
      }),
    );
  }, [isRideStarted, params, router]);

  const callDriver = useCallback(() => {
    const phone = tracking.driverPhone?.trim();
    if (!phone) {
      showAppAlert(
        'Call',
        'Driver phone number is not available on this booking yet.',
      );
      return;
    }
    const tel = phone.startsWith('tel:') ? phone : `tel:${phone}`;
    Linking.openURL(tel).catch(() => {
      showAppAlert('Call', 'Unable to start a call right now.');
    });
  }, [tracking.driverPhone]);

  const chatDriver = useCallback(() => {
    router.push(
      getDriverChatPath({
        driverName: tracking.driver.name,
        carModel: tracking.driver.vehicleLabel.replace(/^White\s+/i, ''),
      }),
    );
  }, [router, tracking.driver.name, tracking.driver.vehicleLabel]);

  const openSupport = useCallback(() => {
    router.push(ROUTES.helpSupport);
  }, [router]);

  return {
    tracking,
    routeCoordinates,
    driverCoordinate,
    riderCoordinate,
    otpDigits,
    isRideStarted,
    isPickupVerified,
    showPickupOtp: showPickupOtp && Boolean(tracking.startOtp),
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
