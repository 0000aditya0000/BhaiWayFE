import type { AssuredDepositPenaltyDto } from '@/features/auth/types';

export type AssuredDepositPenaltySnapshot = AssuredDepositPenaltyDto;

type Listener = () => void;

let snapshot: AssuredDepositPenaltySnapshot | null = null;
const listeners = new Set<Listener>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

/** Backend-owned elevated Assured deposit state from GET /users/me — display only. */
export const assuredDepositPenaltyStore = {
  get: (): AssuredDepositPenaltySnapshot | null => snapshot,

  set: (value: AssuredDepositPenaltySnapshot | null | undefined): void => {
    if (
      value &&
      typeof value.percentage === 'number' &&
      Number.isFinite(value.percentage) &&
      String(value.reason ?? '').trim()
    ) {
      snapshot = {
        percentage: value.percentage,
        reason: String(value.reason).trim(),
      };
    } else {
      snapshot = null;
    }
    emit();
  },

  clear: (): void => {
    snapshot = null;
    emit();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
