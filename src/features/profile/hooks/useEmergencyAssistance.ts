import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { sosSession } from '@/features/sos';
import {
  getSearchParam,
  triggerErrorHaptic,
  triggerLightHaptic,
  triggerSuccessHaptic,
  showAppAlert,
} from '@/shared/utils';
import {
  EMPTY_EMERGENCY_RIDE,
  EMERGENCY_ASSISTANCE_SCREEN,
  EMERGENCY_CONTACTS,
  EMERGENCY_TIPS,
} from '../constants';
import type { EmergencyContact, EmergencyRideSummary } from '../types';
import { resolveEmergencyActiveRide } from '../utils/resolveEmergencyActiveRide';

export interface UseEmergencyAssistanceResult {
  ride: EmergencyRideSummary;
  rideLoading: boolean;
  contacts: readonly EmergencyContact[];
  tips: readonly string[];
  isHolding: boolean;
  holdProgress: number;
  tapCount: number;
  goBack: () => void;
  exitEmergency: () => void;
  startHold: () => void;
  cancelHold: () => void;
  registerTap: () => void;
  callContact: (contact: EmergencyContact) => void;
  openMap: () => void;
  refreshRide: () => void;
}

export const useEmergencyAssistance = (): UseEmergencyAssistanceResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const paramRideId = getSearchParam(params.rideId).trim();
  const [ride, setRide] = useState<EmergencyRideSummary>(EMPTY_EMERGENCY_RIDE);
  const [rideLoading, setRideLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const triggeredRef = useRef(false);
  const requestIdRef = useRef(0);

  const clearHoldTimers = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdDelayRef.current) {
      clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
  }, []);

  const loadRide = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setRideLoading(true);
    try {
      const next = await resolveEmergencyActiveRide();
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (paramRideId && !next.rideId) {
        setRide({ ...next, rideId: paramRideId, hasActiveRide: true });
        return;
      }
      if (paramRideId && next.rideId !== paramRideId) {
        setRide({ ...next, rideId: paramRideId });
        return;
      }
      setRide(next);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setRide(
        paramRideId
          ? { ...EMPTY_EMERGENCY_RIDE, rideId: paramRideId, hasActiveRide: true }
          : EMPTY_EMERGENCY_RIDE,
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setRideLoading(false);
      }
    }
  }, [paramRideId]);

  useFocusEffect(
    useCallback(() => {
      void loadRide();
    }, [loadRide]),
  );

  useEffect(
    () => () => {
      clearHoldTimers();
      if (tapResetRef.current) {
        clearTimeout(tapResetRef.current);
      }
    },
    [clearHoldTimers],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.safetyHub);
  }, [router]);

  const exitEmergency = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const fireAlert = useCallback(() => {
    if (triggeredRef.current) {
      return;
    }
    triggeredRef.current = true;
    triggerErrorHaptic();
    clearHoldTimers();
    setIsHolding(false);
    setHoldProgress(0);
    tapCountRef.current = 0;
    setTapCount(0);
    const rideId = ride.rideId?.trim() || paramRideId;
    if (!rideId) {
      triggeredRef.current = false;
      showAppAlert(
        EMERGENCY_ASSISTANCE_SCREEN.alertTriggeredTitle,
        'SOS is only available during an active ride.',
      );
      return;
    }
    sosSession.confirmTrigger(rideId);
    triggeredRef.current = false;
  }, [clearHoldTimers, paramRideId, ride.rideId]);

  const cancelHold = useCallback(() => {
    clearHoldTimers();
    setIsHolding(false);
    setHoldProgress(0);
  }, [clearHoldTimers]);

  const startHold = useCallback(() => {
    if (triggeredRef.current) {
      return;
    }
    clearHoldTimers();
    holdDelayRef.current = setTimeout(() => {
      triggerLightHaptic();
      setIsHolding(true);
      setHoldProgress(0);

      const startedAt = Date.now();
      holdIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const next = Math.min(1, elapsed / EMERGENCY_ASSISTANCE_SCREEN.holdDurationMs);
        setHoldProgress(next);
      }, 50);

      holdTimeoutRef.current = setTimeout(() => {
        fireAlert();
      }, EMERGENCY_ASSISTANCE_SCREEN.holdDurationMs);
    }, 450);
  }, [clearHoldTimers, fireAlert]);

  const registerTap = useCallback(() => {
    if (triggeredRef.current) {
      return;
    }
    triggerLightHaptic();

    const next = tapCountRef.current + 1;
    const shouldFire = next >= EMERGENCY_ASSISTANCE_SCREEN.tapsRequired;
    tapCountRef.current = shouldFire ? 0 : next;
    setTapCount(tapCountRef.current);

    if (tapResetRef.current) {
      clearTimeout(tapResetRef.current);
    }
    tapResetRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      setTapCount(0);
    }, EMERGENCY_ASSISTANCE_SCREEN.tapWindowMs);

    // Never call showAppAlert from a setState updater — that updates AppAlertModal during render.
    if (shouldFire) {
      fireAlert();
    }
  }, [fireAlert]);

  const callContact = useCallback((contact: EmergencyContact) => {
    triggerLightHaptic();
    if (contact.action === 'alarm') {
      triggerSuccessHaptic();
      showAppAlert(EMERGENCY_ASSISTANCE_SCREEN.alarmTitle, EMERGENCY_ASSISTANCE_SCREEN.alarmMessage);
      return;
    }
    if (!contact.number) {
      return;
    }
    Linking.openURL(`tel:${contact.number}`).catch(() => {
      showAppAlert(
        EMERGENCY_ASSISTANCE_SCREEN.callFailedTitle,
        EMERGENCY_ASSISTANCE_SCREEN.callFailedMessage,
      );
    });
  }, []);

  const openMap = useCallback(() => {
    triggerLightHaptic();
    showAppAlert(EMERGENCY_ASSISTANCE_SCREEN.mapTitle, EMERGENCY_ASSISTANCE_SCREEN.mapMessage);
  }, []);

  return {
    ride,
    rideLoading,
    contacts: EMERGENCY_CONTACTS,
    tips: EMERGENCY_TIPS,
    isHolding,
    holdProgress,
    tapCount,
    goBack,
    exitEmergency,
    startHold,
    cancelHold,
    registerTap,
    callContact,
    openMap,
    refreshRide: () => {
      void loadRide();
    },
  };
};
