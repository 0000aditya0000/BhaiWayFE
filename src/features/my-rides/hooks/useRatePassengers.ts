import { useCallback, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  RATING_TASK_COPY,
  useRatingTaskFlow,
} from '@/features/ratings';
import {
  getSearchParam,
  resetTo,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '@/shared/utils';
import { getRatingsSubmittedPath } from '../constants';

export interface UseRatePassengersResult {
  rideId: string;
  loading: boolean;
  error: string | null;
  currentTaskName: string;
  currentTaskPhoto: string;
  routeLabel: string;
  progressLabel: string;
  rating: number;
  comment: string;
  submitting: boolean;
  skipping: boolean;
  canSubmit: boolean;
  isComplete: boolean;
  setRating: (value: number) => void;
  setComment: (value: string) => void;
  submitCurrent: () => void;
  skipCurrent: () => void;
  refresh: () => void;
  goBack: () => void;
}

export const useRatePassengers = (): UseRatePassengersResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string; destination?: string }>();
  const rideId = getSearchParam(params.rideId).trim();
  const destination = getSearchParam(params.destination).trim();
  const exitHandledRef = useRef(false);

  const {
    loading,
    error,
    currentTask,
    totalCount,
    currentIndex,
    rating,
    comment,
    submitting,
    skipping,
    isComplete,
    submittedItems,
    setRating,
    setComment,
    submitCurrent,
    skipCurrent,
    refresh,
    canSubmit,
  } = useRatingTaskFlow({
    rideId,
    audience: 'driver-passenger',
    enabled: Boolean(rideId),
  });

  useEffect(() => {
    if (loading || !isComplete || exitHandledRef.current) {
      return;
    }

    exitHandledRef.current = true;
    triggerSuccessHaptic();

    if (submittedItems.length > 0) {
      // Clear trip-completed + rate stack so Back cannot reopen the same reviews.
      resetTo(
        router,
        getRatingsSubmittedPath({
          rideId,
          items: submittedItems,
        }),
      );
      return;
    }

    resetTo(router, ROUTES.myRides);
  }, [isComplete, loading, rideId, router, submittedItems]);

  const handleSubmit = useCallback(() => {
    triggerLightHaptic();
    void submitCurrent();
  }, [submitCurrent]);

  const handleSkip = useCallback(() => {
    triggerLightHaptic();
    void skipCurrent();
  }, [skipCurrent]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    resetTo(router, ROUTES.myRides);
  }, [router]);

  const routeLabel =
    currentTask?.ride != null
      ? RATING_TASK_COPY.routeLabel(
          currentTask.ride.source,
          currentTask.ride.destination,
        )
      : destination;

  return {
    rideId,
    loading,
    error,
    currentTaskName: currentTask?.userName ?? '',
    currentTaskPhoto: currentTask?.userPhoto ?? '',
    routeLabel,
    progressLabel:
      totalCount > 0
        ? RATING_TASK_COPY.progressLabel(currentIndex, totalCount)
        : '',
    rating,
    comment,
    submitting,
    skipping,
    canSubmit,
    isComplete,
    setRating,
    setComment,
    submitCurrent: handleSubmit,
    skipCurrent: handleSkip,
    refresh: () => {
      void refresh();
    },
    goBack,
  };
};
