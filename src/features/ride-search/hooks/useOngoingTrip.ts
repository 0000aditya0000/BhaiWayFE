import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { getBookingById, resolveBookingRideId, resolveDriverDisplayName } from '../api';
import { resolveDriverContactPhone } from '../utils/bookingContactPhone';
import {
  getOngoingTripMock,
  getDriverChatPath,
  getTripCompletedPath,
} from '../constants';
import { fetchDrivingRoute } from '../services';
import type { MapCoordinate, OngoingTripData, RideType } from '../types';
import { openPhoneCall, showAppAlert } from '@/shared/utils';

const BOOKING_POLL_MS = 5000;

export interface UseOngoingTripParams {
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
  bookingId?: string;
}

export interface UseOngoingTripResult {
  trip: OngoingTripData;
  routeCoordinates: MapCoordinate[];
  goBack: () => void;
  callDriver: () => void;
  chatDriver: () => void;
  openSafety: () => void;
  triggerSos: () => void;
  completeTrip: () => void;
}

export const useOngoingTrip = (params: UseOngoingTripParams): UseOngoingTripResult => {
  const router = useRouter();
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const navigatingCompletedRef = useRef(false);
  const bookingId = params.bookingId?.trim() ?? '';

  const trip = useMemo(
    () =>
      getOngoingTripMock({
        rideId: params.rideId,
        rideType: params.rideType,
        driverName: params.driverName,
        carModel: params.carModel,
        price: params.price,
        originLat: params.originLat,
        originLng: params.originLng,
        destinationLat: params.destinationLat,
        destinationLng: params.destinationLng,
      }),
    [
      params.carModel,
      params.destinationLat,
      params.destinationLng,
      params.driverName,
      params.originLat,
      params.originLng,
      params.price,
      params.rideId,
      params.rideType,
    ],
  );

  const navigateAfterTripCompletion = useCallback(
    async (booking?: Awaited<ReturnType<typeof getBookingById>>) => {
      if (navigatingCompletedRef.current) {
        return;
      }
      navigatingCompletedRef.current = true;

      let resolvedBooking = booking;
      if (!resolvedBooking && bookingId) {
        try {
          resolvedBooking = await getBookingById(bookingId);
        } catch (error) {
          console.log('[OngoingTrip] completion booking fetch failed', error);
        }
      }

      const rideId = resolvedBooking
        ? resolveBookingRideId(resolvedBooking)
        : params.rideId;
      const driverName = resolvedBooking
        ? resolveDriverDisplayName(resolvedBooking) || params.driverName
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
        bookingId: resolvedBooking?.id || bookingId || undefined,
      };

      // Always land on trip-completed first (payment method → then rating).
      router.replace(getTripCompletedPath(tripCompletedParams));
    },
    [bookingId, params, router],
  );

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const booking = await getBookingById(bookingId);
        if (cancelled) {
          return;
        }
        setDriverPhone(resolveDriverContactPhone(booking) || null);
        const rideStatus = String(booking.ride?.status ?? '').toUpperCase();
        const bookingStatus = String(booking.status ?? '').toUpperCase();
        if (rideStatus === 'COMPLETED' || bookingStatus === 'COMPLETED') {
          void navigateAfterTripCompletion(booking);
        }
      } catch (error) {
        console.log('[OngoingTrip] getBookingById failed', error);
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
  }, [bookingId, navigateAfterTripCompletion]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      try {
        const route = await fetchDrivingRoute(trip.pickup, trip.dropoff);
        if (!cancelled && route.coordinates.length >= 2) {
          setRouteCoordinates(route.coordinates);
        }
      } catch {
        if (!cancelled) {
          setRouteCoordinates([trip.pickup, trip.dropoff]);
        }
      }
    };

    void loadRoute();
    return () => {
      cancelled = true;
    };
  }, [trip.dropoff, trip.pickup]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.rideSearchLiveTracking);
  }, [router]);

  const callDriver = useCallback(() => {
    if (!driverPhone) {
      showAppAlert('Call', 'Driver phone number is not available on this booking yet.');
      return;
    }
    void openPhoneCall(driverPhone).then((started) => {
      if (!started) {
        showAppAlert('Call', 'Unable to start a call right now.');
      }
    });
  }, [driverPhone]);

  const chatDriver = useCallback(() => {
    router.push(
      getDriverChatPath({
        driverName: trip.driver.name,
        carModel: trip.driver.vehicleLabel.replace(/^White\s+/i, ''),
        bookingId,
        perspective: 'rider',
      }),
    );
  }, [bookingId, router, trip.driver.name, trip.driver.vehicleLabel]);

  const openSafety = useCallback(() => {
    router.push(ROUTES.safetyHub);
  }, [router]);

  const triggerSos = useCallback(() => {
    const rideId = params.rideId.trim();
    router.push({
      pathname: ROUTES.emergencyAssistance,
      params: rideId && rideId !== 'ride-default' ? { rideId } : undefined,
    });
  }, [params.rideId, router]);

  const completeTrip = useCallback(() => {
    void navigateAfterTripCompletion();
  }, [navigateAfterTripCompletion]);

  return {
    trip,
    routeCoordinates,
    goBack,
    callDriver,
    chatDriver,
    openSafety,
    triggerSos,
    completeTrip,
  };
};
