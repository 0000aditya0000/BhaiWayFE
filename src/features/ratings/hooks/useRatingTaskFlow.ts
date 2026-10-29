import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage, showAppAlert } from '@/shared/utils';

import {
  getPendingRatings,
  skipRatingTask,
  submitRating,
  type PendingRatingTask,
} from '../api';
import { RATING_TASK_COPY } from '../constants/rating-task.constants';
import {
  clampRatingComment,
  excludeSkippedInSession,
  filterDriverPassengerRatingTasks,
  filterPassengerDriverRatingTasks,
  isValidRatingValue,
} from '../utils/pendingRatingTasks';

export type RatingTaskAudience = 'driver-passenger' | 'passenger-driver';

export interface SubmittedRatingItem {
  id: string;
  name: string;
  avatarUri: string;
  rating: number;
}

export interface UseRatingTaskFlowParams {
  rideId?: string;
  audience: RatingTaskAudience;
  enabled?: boolean;
}

export interface UseRatingTaskFlowResult {
  loading: boolean;
  error: string | null;
  currentTask: PendingRatingTask | null;
  totalCount: number;
  currentIndex: number;
  rating: number;
  comment: string;
  submitting: boolean;
  skipping: boolean;
  isComplete: boolean;
  submittedItems: readonly SubmittedRatingItem[];
  setRating: (value: number) => void;
  setComment: (value: string) => void;
  submitCurrent: () => Promise<boolean>;
  skipCurrent: () => Promise<boolean>;
  refresh: () => Promise<void>;
  canSubmit: boolean;
}

const filterTasksForAudience = (
  items: readonly PendingRatingTask[],
  audience: RatingTaskAudience,
  rideId?: string,
): PendingRatingTask[] =>
  audience === 'driver-passenger'
    ? filterDriverPassengerRatingTasks(items, rideId)
    : filterPassengerDriverRatingTasks(items, rideId);

const PENDING_RATING_RETRY_MS = 2000;
const PENDING_RATING_RETRY_MAX = 4;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const useRatingTaskFlow = (
  params: UseRatingTaskFlowParams,
): UseRatingTaskFlowResult => {
  const enabled = params.enabled ?? true;
  const rideId = params.rideId?.trim() || undefined;

  const [allTasks, setAllTasks] = useState<PendingRatingTask[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRatingState] = useState(0);
  const [comment, setCommentState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [sessionSkippedTaskIds, setSessionSkippedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [submittedItems, setSubmittedItems] = useState<SubmittedRatingItem[]>([]);
  const mutationInFlightRef = useRef(false);
  /** True once the first pending fetch finishes — used so empty queues don't look "complete". */
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const scopedTasks = useMemo(
    () => filterTasksForAudience(allTasks, params.audience, rideId),
    [allTasks, params.audience, rideId],
  );

  const activeTasks = useMemo(
    () =>
      excludeSkippedInSession(
        scopedTasks.filter((task) => !completedTaskIds.has(task.taskId)),
        sessionSkippedTaskIds,
      ),
    [completedTaskIds, scopedTasks, sessionSkippedTaskIds],
  );

  const currentTask = activeTasks[0] ?? null;
  const totalCount = Math.max(
    scopedTasks.length,
    completedTaskIds.size + sessionSkippedTaskIds.size,
  );
  const finishedCount = completedTaskIds.size + sessionSkippedTaskIds.size;
  const currentIndex =
    currentTask == null
      ? finishedCount
      : Math.min(totalCount, finishedCount + 1);

  const resetDraft = useCallback(() => {
    setRatingState(0);
    setCommentState('');
  }, []);

  /**
   * Initial load may retry briefly (backend can lag creating pending tasks after trip complete).
   * Post-submit refresh must NOT retry for presence — that re-surfaces already-rated passengers.
   */
  const refresh = useCallback(
    async (options?: { retryUntilPresent?: boolean }) => {
      if (!enabled) {
        setLoading(false);
        setHasLoadedOnce(true);
        return;
      }
      const retryUntilPresent = options?.retryUntilPresent === true;
      setLoading(true);
      setError(null);
      try {
        const maxAttempts = retryUntilPresent ? PENDING_RATING_RETRY_MAX : 1;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const next = await getPendingRatings();
          setAllTasks(next);
          const scoped = filterTasksForAudience(next, params.audience, rideId);
          if (
            !retryUntilPresent ||
            scoped.length > 0 ||
            !rideId ||
            attempt === maxAttempts - 1
          ) {
            return;
          }
          await wait(PENDING_RATING_RETRY_MS);
        }
      } catch (err) {
        setError(getErrorMessage(err, RATING_TASK_COPY.loadFailedMessage));
      } finally {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    },
    [enabled, params.audience, rideId],
  );

  useEffect(() => {
    void refresh({ retryUntilPresent: true });
  }, [refresh]);

  useEffect(() => {
    resetDraft();
  }, [currentTask?.taskId, resetDraft]);

  const setRating = useCallback((value: number) => {
    if (!isValidRatingValue(value)) {
      return;
    }
    setRatingState(value);
  }, []);

  const setComment = useCallback((value: string) => {
    setCommentState(clampRatingComment(value));
  }, []);

  const submitCurrent = useCallback(async (): Promise<boolean> => {
    if (!currentTask || mutationInFlightRef.current) {
      return false;
    }
    if (!isValidRatingValue(rating)) {
      showAppAlert(
        RATING_TASK_COPY.ratingRequiredTitle,
        RATING_TASK_COPY.ratingRequiredMessage,
      );
      return false;
    }

    mutationInFlightRef.current = true;
    setSubmitting(true);
    try {
      await submitRating({
        taskId: currentTask.taskId,
        rating,
        comment: comment.trim() || undefined,
      });
      const finishedTaskId = currentTask.taskId;
      setCompletedTaskIds((prev) => new Set(prev).add(finishedTaskId));
      setSubmittedItems((prev) => [
        ...prev,
        {
          id: finishedTaskId,
          name: currentTask.userName,
          avatarUri: currentTask.userPhoto || '',
          rating,
        },
      ]);
      // Drop locally so a laggy pending API cannot re-queue the same passenger.
      setAllTasks((prev) => prev.filter((task) => task.taskId !== finishedTaskId));
      resetDraft();
      return true;
    } catch (err) {
      showAppAlert(
        RATING_TASK_COPY.submitFailedTitle,
        getErrorMessage(err, 'Please try again.'),
      );
      return false;
    } finally {
      mutationInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [comment, currentTask, rating, resetDraft]);

  const skipCurrent = useCallback(async (): Promise<boolean> => {
    if (!currentTask || mutationInFlightRef.current) {
      return false;
    }

    mutationInFlightRef.current = true;
    setSkipping(true);
    try {
      await skipRatingTask(currentTask.taskId);
      const skippedId = currentTask.taskId;
      setSessionSkippedTaskIds((prev) => new Set(prev).add(skippedId));
      setAllTasks((prev) => prev.filter((task) => task.taskId !== skippedId));
      resetDraft();
      return true;
    } catch (err) {
      showAppAlert(
        RATING_TASK_COPY.skipFailedTitle,
        getErrorMessage(err, 'Please try again.'),
      );
      return false;
    } finally {
      mutationInFlightRef.current = false;
      setSkipping(false);
    }
  }, [currentTask, resetDraft]);

  const canSubmit = isValidRatingValue(rating) && !submitting && !skipping;

  const isComplete =
    hasLoadedOnce &&
    !loading &&
    activeTasks.length === 0 &&
    (completedTaskIds.size > 0 || sessionSkippedTaskIds.size > 0);

  return {
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
    refresh: () => refresh({ retryUntilPresent: false }),
    canSubmit,
  };
};
