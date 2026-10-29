import type { WalletBalanceDto } from '../api/wallet.types';

export type WalletStoreSnapshot = {
  balance: WalletBalanceDto | null;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  /** Bumped after successful top-up so screens reload transaction history from API. */
  transactionsRefreshToken: number;
};

type Listener = () => void;

const listeners = new Set<Listener>();

let snapshot: WalletStoreSnapshot = {
  balance: null,
  loading: false,
  error: null,
  updatedAt: null,
  transactionsRefreshToken: 0,
};

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const walletStore = {
  getSnapshot: (): WalletStoreSnapshot => snapshot,

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setLoading: (loading: boolean): void => {
    snapshot = { ...snapshot, loading };
    emit();
  },

  setBalance: (balance: WalletBalanceDto): void => {
    snapshot = {
      balance,
      loading: false,
      error: null,
      updatedAt: Date.now(),
      transactionsRefreshToken: snapshot.transactionsRefreshToken,
    };
    emit();
  },

  setError: (error: string): void => {
    snapshot = {
      ...snapshot,
      loading: false,
      error,
    };
    emit();
  },

  clear: (): void => {
    snapshot = {
      balance: null,
      loading: false,
      error: null,
      updatedAt: null,
      transactionsRefreshToken: snapshot.transactionsRefreshToken,
    };
    emit();
  },

  /** Notify listeners to reload GET /wallet/transactions after backend top-up settlement. */
  bumpTransactionsRefresh: (): void => {
    snapshot = {
      ...snapshot,
      transactionsRefreshToken: snapshot.transactionsRefreshToken + 1,
    };
    emit();
  },
};
