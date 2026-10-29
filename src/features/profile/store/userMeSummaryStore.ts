import type { DriverEarningsDto, UserRatingsBlockDto } from '@/features/auth/types';

export type UserMeSummarySnapshot = {
  driverEarnings: DriverEarningsDto | null;
  ratings: UserRatingsBlockDto | null;
};

type Listener = () => void;

let snapshot: UserMeSummarySnapshot = {
  driverEarnings: null,
  ratings: null,
};

const listeners = new Set<Listener>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

/** Driver earnings + ratings from GET /users/me — display only. */
export const userMeSummaryStore = {
  getSnapshot: (): UserMeSummarySnapshot => snapshot,

  set: (value: Partial<UserMeSummarySnapshot>): void => {
    snapshot = {
      driverEarnings: value.driverEarnings ?? snapshot.driverEarnings,
      ratings: value.ratings ?? snapshot.ratings,
    };
    emit();
  },

  apply: (value: {
    driverEarnings?: DriverEarningsDto | null;
    ratings?: UserRatingsBlockDto | null;
  }): void => {
    snapshot = {
      driverEarnings: value.driverEarnings ?? null,
      ratings: value.ratings ?? null,
    };
    emit();
  },

  clear: (): void => {
    snapshot = {
      driverEarnings: null,
      ratings: null,
    };
    emit();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
