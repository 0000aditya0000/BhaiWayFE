/**
 * Remembers where to return after a wallet top-up started from a booking flow.
 * Cleared after consume or explicit clear.
 */
export type WalletTopUpReturnTarget = {
  pathname: string;
  params?: Record<string, string>;
};

type Listener = (target: WalletTopUpReturnTarget | null) => void;

let target: WalletTopUpReturnTarget | null = null;
const listeners = new Set<Listener>();

const notify = (): void => {
  listeners.forEach((listener) => listener(target));
};

export const walletTopUpReturnStore = {
  get: (): WalletTopUpReturnTarget | null => target,

  set: (next: WalletTopUpReturnTarget | null): void => {
    target = next
      ? {
          pathname: next.pathname,
          params: next.params ? { ...next.params } : undefined,
        }
      : null;
    notify();
  },

  /** Read and clear in one step. */
  consume: (): WalletTopUpReturnTarget | null => {
    const current = target;
    target = null;
    notify();
    return current;
  },

  clear: (): void => {
    if (target == null) {
      return;
    }
    target = null;
    notify();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
