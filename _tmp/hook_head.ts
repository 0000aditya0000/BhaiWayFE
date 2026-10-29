import { useCallback, useEffect, useMemo, useState } from 'react';
import { showAppAlert } from '@/store';
import { Linking, Share } from 'react-native';

import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  getLiveTrackingMock,
  getDriverChatPath,
  getOngoingTripPath,
  LIVE_TRACKING_SCREEN,
} from '../constants';
import { fetchDrivingRoute } from '../services';
import { tripStartedStore } from '../store';
import type { LiveTrackingData, MapCoordinate, RideType } from '../types';

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
}

export interface UseLiveTrackingResult {
  tracking: LiveTrackingData;
  routeCoordinates: MapCoordinate[];
  otpDigits: string[];
  /** Map is shown only after the driver starts the ride (start OTP). */
  isRideStarted: boolean;
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
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [isRideStarted, setIsRideStarted] = useState(() =>
    tripStartedStore.isStarted(params.rideId),
  );

  const tracking = useMemo(
    () =>
      getLiveTrackingMock({
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
      }),
    [
      params.carModel,
      params.destination,
      params.destinationLat,
      params.destinationLng,
      params.driverName,
      params.origin,
      params.originLat,
      params.originLng,
      params.rideId,
      params.rideType,
    ],
  );

  const otpDigits = useMemo(
    () => tracking.startOtp.padEnd(4, '0').slice(0, 4).split(''),
    [tracking.startOtp],
  );

  useEffect(() => {
    setIsRideStarted(tripStartedStore.isStarted(params.rideId));
    return tripStartedStore.subscribe(() => {
      setIsRideStarted(tripStartedStore.isStarted(params.rideId));
    });
  }, [params.rideId]);

  useEffect(() => {
    if (!isRideStarted) {
      setRouteCoordinates([]);
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      try {
        const route = await fetchDrivingRoute(tracking.pickup, tracking.dropoff);
        if (!cancelled && route.coordinates.length >= 2) {
          setRouteCoordinates(route.coordinates);
        }
      } catch {
        if (!cancelled) {
          setRouteCoordinates([tracking.pickup, tracking.dropoff]);
        }
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [isRideStarted, tracking.dropoff, tracking.pickup]);

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
    Share.share({
      message: LIVE_TRACKING_SCREEN.shareTripMessage(
        tracking.driver.name,
        tracking.etaMinutes,
        tracking.startOtp,
      ),
    }).catch(() => {
      showAppAlert(
        LIVE_TRACKING_SCREEN.shareTripLabel,
        LIVE_TRACKING_SCREEN.shareTripMessage(
          tracking.driver.name,
          tracking.etaMinutes,
          tracking.startOtp,
        ),
      );
    });
  }, [tracking.driver.name, tracking.etaMinutes, tracking.startOtp]);

  const explainOtp = useCallback(() => {
    showAppAlert(LIVE_TRACKING_SCREEN.whyOtpTitle, LIVE_TRACKING_SCREEN.whyOtpMessage);
  }, []);

  const openOngoingTrip = useCallback(() => {
    if (!tripStartedStore.isStarted(params.rideId)) {
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
  }, [params, router]);

  const callDriver = useCallback(() => {
    Linking.openURL('tel:+919999999999').catch(() => {
      showAppAlert('Call', 'Unable to start a call right now.');
    });
  }, []);

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
    otpDigits,
    isRideStarted,
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
