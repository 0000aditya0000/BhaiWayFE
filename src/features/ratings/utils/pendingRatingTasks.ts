import type { PendingRatingTask, RatingTaskRole } from '../api';

/** role=PASSENGER → logged-in driver rates that passenger. */
export const isDriverRatesPassengerTask = (task: PendingRatingTask): boolean =>
  task.role === 'PASSENGER';

/** role=DRIVER → logged-in passenger rates that driver. */
export const isPassengerRatesDriverTask = (task: PendingRatingTask): boolean =>
  task.role === 'DRIVER';

export const filterPendingTasksByRideId = (
  items: readonly PendingRatingTask[],
  rideId: string | null | undefined,
): PendingRatingTask[] => {
  const safeRideId = String(rideId ?? '').trim();
  if (!safeRideId) {
    return [...items];
  }
  return items.filter((task) => task.rideId === safeRideId);
};

export const filterPendingTasksByRole = (
  items: readonly PendingRatingTask[],
  role: RatingTaskRole,
): PendingRatingTask[] => items.filter((task) => task.role === role);

export const filterDriverPassengerRatingTasks = (
  items: readonly PendingRatingTask[],
  rideId?: string | null,
): PendingRatingTask[] =>
  filterPendingTasksByRideId(
    items.filter(isDriverRatesPassengerTask),
    rideId,
  );

export const filterPassengerDriverRatingTasks = (
  items: readonly PendingRatingTask[],
  rideId?: string | null,
): PendingRatingTask[] =>
  filterPendingTasksByRideId(
    items.filter(isPassengerRatesDriverTask),
    rideId,
  );

export const excludeSkippedInSession = (
  items: readonly PendingRatingTask[],
  sessionSkippedTaskIds: ReadonlySet<string>,
): PendingRatingTask[] =>
  items.filter((task) => !sessionSkippedTaskIds.has(task.taskId));

export const MAX_RATING_COMMENT_LENGTH = 500;

export const clampRatingComment = (value: string): string =>
  value.slice(0, MAX_RATING_COMMENT_LENGTH);

export const isValidRatingValue = (value: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= 5;
