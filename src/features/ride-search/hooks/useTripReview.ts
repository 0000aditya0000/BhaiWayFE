import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import {
  RATING_TASK_COPY,
  submitRating,
  useRatingTaskFlow,
} from '@/features/ratings';
import { getErrorMessage, resetTo, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import {
  DRIVER_FEEDBACK_TAGS,
  getFeedbackSubmittedPath,
  TRIP_REVIEW_SCREEN,
  VEHICLE_FEEDBACK_TAGS,
} from '../constants';
import type { RatingValue, TripReviewData } from '../types';

export interface UseTripReviewParams {
  rideId: string;
  driverName?: string;
}

export interface UseTripReviewResult {
  review: TripReviewData;
  driverTags: typeof DRIVER_FEEDBACK_TAGS;
  vehicleTags: typeof VEHICLE_FEEDBACK_TAGS;
  driverRating: RatingValue;
  vehicleRating: RatingValue;
  selectedDriverTags: string[];
  selectedVehicleTags: string[];
  comments: string;
  submitting: boolean;
  skipping: boolean;
  loading: boolean;
  loadError: string | null;
  hasPendingTask: boolean;
  setDriverRating: (value: RatingValue) => void;
  setVehicleRating: (value: RatingValue) => void;
  toggleDriverTag: (id: string) => void;
  toggleVehicleTag: (id: string) => void;
  setComments: (value: string) => void;
  submitFeedback: () => void;
  skipFeedback: () => void;
  close: () => void;
}

const toggleId = (list: string[], id: string): string[] =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

const buildCommentPayload = (
  comments: string,
  selectedDriverTags: string[],
  selectedVehicleTags: string[],
  driverTags: typeof DRIVER_FEEDBACK_TAGS,
  vehicleTags: typeof VEHICLE_FEEDBACK_TAGS,
): string | undefined => {
  const parts: string[] = [];
  const trimmed = comments.trim();
  if (trimmed) {
    parts.push(trimmed);
  }
  const driverLabels = driverTags
    .filter((tag) => selectedDriverTags.includes(tag.id))
    .map((tag) => tag.label);
  const vehicleLabels = vehicleTags
    .filter((tag) => selectedVehicleTags.includes(tag.id))
    .map((tag) => tag.label);
  const tagLabels = [...driverLabels, ...vehicleLabels];
  if (tagLabels.length > 0) {
    parts.push(`Highlights: ${tagLabels.join(', ')}`);
  }
  const merged = parts.join('\n').trim();
  return merged || undefined;
};

export const useTripReview = (params: UseTripReviewParams): UseTripReviewResult => {
  const router = useRouter();
  const [vehicleRating, setVehicleRating] = useState<RatingValue>(0);
  const [selectedDriverTags, setSelectedDriverTags] = useState<string[]>([]);
  const [selectedVehicleTags, setSelectedVehicleTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const {
    loading,
    error,
    currentTask,
    rating: driverRating,
    comment: comments,
    skipping,
    setRating: setDriverRating,
    setComment: setComments,
    skipCurrent,
  } = useRatingTaskFlow({
    rideId: params.rideId,
    audience: 'passenger-driver',
    enabled: Boolean(params.rideId?.trim()),
  });

  const review = useMemo<TripReviewData>(
    () => ({
      rideId: params.rideId,
      driverName:
        currentTask?.userName?.trim() ||
        params.driverName?.trim() ||
        'Driver',
      driverAvatarUri: currentTask?.userPhoto?.trim() || undefined,
    }),
    [currentTask?.userName, currentTask?.userPhoto, params.driverName, params.rideId],
  );

  const toggleDriverTag = useCallback((id: string) => {
    setSelectedDriverTags((prev) => toggleId(prev, id));
  }, []);

  const toggleVehicleTag = useCallback((id: string) => {
    setSelectedVehicleTags((prev) => toggleId(prev, id));
  }, []);

  const close = useCallback(() => {
    resetTo(router, ROUTES.home);
  }, [router]);

  const submitFeedback = useCallback(() => {
    if (!currentTask) {
      showAppAlert(
        RATING_TASK_COPY.emptyTitle,
        RATING_TASK_COPY.emptyMessage,
      );
      close();
      return;
    }
    if (driverRating < 1) {
      showAppAlert(
        TRIP_REVIEW_SCREEN.ratingRequiredTitle,
        TRIP_REVIEW_SCREEN.ratingRequiredMessage,
      );
      return;
    }

    const mergedComment = buildCommentPayload(
      comments,
      selectedDriverTags,
      selectedVehicleTags,
      DRIVER_FEEDBACK_TAGS,
      VEHICLE_FEEDBACK_TAGS,
    );

    setSubmitting(true);
    void (async () => {
      try {
        await submitRating({
          taskId: currentTask.taskId,
          rating: driverRating,
          comment: mergedComment,
        });
        router.replace(
          getFeedbackSubmittedPath({ rating: driverRating }),
        );
      } catch (err) {
        showAppAlert(
          RATING_TASK_COPY.submitFailedTitle,
          getErrorMessage(err, 'Please try again.'),
        );
      } finally {
        setSubmitting(false);
      }
    })();
  }, [
    close,
    comments,
    currentTask,
    driverRating,
    router,
    selectedDriverTags,
    selectedVehicleTags,
  ]);

  const skipFeedback = useCallback(() => {
    if (!currentTask) {
      close();
      return;
    }
    triggerLightHaptic();
    void (async () => {
      const ok = await skipCurrent();
      if (!ok) {
        return;
      }
      showAppAlert(
        RATING_TASK_COPY.skipSuccessTitle,
        RATING_TASK_COPY.skipSuccessMessage,
      );
      close();
    })();
  }, [close, currentTask, skipCurrent]);

  return {
    review,
    driverTags: DRIVER_FEEDBACK_TAGS,
    vehicleTags: VEHICLE_FEEDBACK_TAGS,
    driverRating: driverRating as RatingValue,
    vehicleRating,
    selectedDriverTags,
    selectedVehicleTags,
    comments,
    submitting,
    skipping,
    loading,
    loadError: error,
    hasPendingTask: Boolean(currentTask),
    setDriverRating: (value) => setDriverRating(value),
    setVehicleRating,
    toggleDriverTag,
    toggleVehicleTag,
    setComments,
    submitFeedback,
    skipFeedback,
    close,
  };
};
