import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  DEFAULT_DRIVER_PICKUP_STOPS,
  DRIVER_PICKUP_SCREEN,
  getDriverActiveTripPath,
} from '../constants';
import { requiresPickupOtp } from '../utils';
import type { DriverPickupStop } from '../types';
import { tripStartedStore } from '@/features/ride-search/store';
import { useDriverRideKind } from './useDriverRideKind';

/** Fraction of the swipe track that opens rider OTP (60%). */
export const DRIVER_PICKUP_OTP_SWIPE_THRESHOLD = 0.6;

export interface UseDriverPickupResult {
  stop: DriverPickupStop;
  stopTitle: string;
  confirming: boolean;
  /** Rider OTP is required for every ride before start. */
  requiresOtp: boolean;
  otpVisible: boolean;
  otpValue: string;
  otpError: string | null;
  otpVerifying: boolean;
  confirmedVisible: boolean;
  isLastStop: boolean;
  /** Remount key so canceling OTP resets the swipe handle. */
  swipeResetKey: string;
  /** Opens rider OTP once the driver slides past the threshold. */
  requestRiderOtp: () => void;
  setOtpValue: (value: string) => void;
  verifyOtp: () => void;
  closeOtp: () => void;
  continueAfterConfirmed: () => void;
  goBack: () => void;
  openNotifications: () => void;
}

export const useDriverPickup = (): UseDriverPickupResult => {
  const router = useRouter();
  const rideType = useDriverRideKind();
  const requiresOtp = requiresPickupOtp(rideType);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpValue, setOtpValueState] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [confirmedVisible, setConfirmedVisible] = useState(false);
  const [swipeEpoch, setSwipeEpoch] = useState(0);

  const stop = useMemo(
    () => DEFAULT_DRIVER_PICKUP_STOPS[currentIndex] ?? DEFAULT_DRIVER_PICKUP_STOPS[0],
    [currentIndex],
  );

  const isLastStop = currentIndex >= DEFAULT_DRIVER_PICKUP_STOPS.length - 1;
  const stopTitle = DRIVER_PICKUP_SCREEN.pickupTitle(stop.index, stop.total);
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
    if (confirming || otpVisible) {
      return;
    }
    resetOtp();
    setOtpVisible(true);
  }, [confirming, otpVisible, resetOtp]);

  const closeOtp = useCallback(() => {
    setOtpVisible(false);
    setConfirming(false);
    resetOtp();
    setSwipeEpoch((prev) => prev + 1);
  }, [resetOtp]);

  const continueAfterConfirmed = useCallback(() => {
    setConfirmedVisible(false);

    if (isLastStop) {
      router.replace(getDriverActiveTripPath(rideType));
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setConfirming(false);
    resetOtp();
    setSwipeEpoch((prev) => prev + 1);
  }, [isLastStop, resetOtp, rideType, router]);

  const verifyOtp = useCallback(() => {
    if (otpVerifying) {
      return;
    }

    if (otpValue.length !== DRIVER_PICKUP_SCREEN.otpLength) {
      setOtpError(DRIVER_PICKUP_SCREEN.otpInvalidMessage);
      return;
    }

    setOtpVerifying(true);

    setTimeout(() => {
      if (otpValue !== stop.otp) {
        setOtpError(DRIVER_PICKUP_SCREEN.otpInvalidMessage);
        setOtpVerifying(false);
        return;
      }

      // Successful rider OTP → ride start unlocked for this pickup.
      tripStartedStore.markStarted(stop.id);

      setOtpVisible(false);
      setOtpVerifying(false);
      setConfirming(true);
      setConfirmedVisible(true);
    }, 400);
  }, [otpValue, otpVerifying, stop.id, stop.otp]);

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
    requestRiderOtp,
    setOtpValue,
    verifyOtp,
    closeOtp,
    continueAfterConfirmed,
    goBack,
    openNotifications,
  };
};
