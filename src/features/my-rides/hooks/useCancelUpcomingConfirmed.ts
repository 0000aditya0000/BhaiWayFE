import { useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import { appModeStore } from '@/store';
import { resetTo } from '@/shared/utils';
import { CANCEL_UPCOMING_CONFIRMED_SCREEN } from '../constants';
import { assuredPassengerCancelStore } from '../store';

export interface UseCancelUpcomingConfirmedResult {
  heading: string;
  subtitle: string;
  detailLines: readonly string[];
  showAssuredPassengerResult: boolean;
  backLabel: string;
  goToMyRides: () => void;
}

export const useCancelUpcomingConfirmed = (): UseCancelUpcomingConfirmedResult => {
  const router = useRouter();
  const isDriving = appModeStore.get() === 'driving';
  const assuredSnapshot = useSyncExternalStore(
    assuredPassengerCancelStore.subscribe,
    assuredPassengerCancelStore.get,
    assuredPassengerCancelStore.get,
  );

  const goToMyRides = useCallback(() => {
    assuredPassengerCancelStore.clear();
    resetTo(router, ROUTES.myRides);
  }, [router]);

  const showAssuredPassengerResult =
    !isDriving && assuredSnapshot != null && assuredSnapshot.display.lines.length > 0;

  return {
    heading: showAssuredPassengerResult
      ? assuredSnapshot!.display.heading
      : CANCEL_UPCOMING_CONFIRMED_SCREEN.heading,
    subtitle: showAssuredPassengerResult
      ? ''
      : isDriving
        ? CANCEL_UPCOMING_CONFIRMED_SCREEN.subtitleDriving
        : CANCEL_UPCOMING_CONFIRMED_SCREEN.subtitleRiding,
    detailLines: showAssuredPassengerResult ? assuredSnapshot!.display.lines : [],
    showAssuredPassengerResult,
    backLabel: CANCEL_UPCOMING_CONFIRMED_SCREEN.backLabel,
    goToMyRides,
  };
};
