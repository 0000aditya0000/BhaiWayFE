import type { NoShowClaimKind } from '../api/noShow.types';

export interface RememberedNoShowClaim {
  claimId: string;
  rideId: string;
  bookingId: string | null;
  kind: NoShowClaimKind | string;
}

type Listener = () => void;

const byClaimId = new Map<string, RememberedNoShowClaim>();
const listeners = new Set<Listener>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

const remember = (entry: RememberedNoShowClaim): void => {
  const claimId = entry.claimId.trim();
  const rideId = entry.rideId.trim();
  if (!claimId || !rideId) {
    return;
  }
  byClaimId.set(claimId, {
    claimId,
    rideId,
    bookingId: entry.bookingId?.trim() || null,
    kind: entry.kind,
  });
  emit();
};

const findForContext = (input: {
  rideId?: string | null;
  bookingId?: string | null;
}): RememberedNoShowClaim | null => {
  const rideId = input.rideId?.trim() || '';
  const bookingId = input.bookingId?.trim() || '';
  let rideLevel: RememberedNoShowClaim | null = null;
  for (const entry of byClaimId.values()) {
    if (bookingId && entry.bookingId === bookingId) {
      return entry;
    }
    if (rideId && entry.rideId === rideId && !entry.bookingId) {
      rideLevel = entry;
    }
  }
  if (bookingId) {
    return rideLevel;
  }
  if (rideId) {
    for (const entry of byClaimId.values()) {
      if (entry.rideId === rideId) {
        return entry;
      }
    }
  }
  return rideLevel;
};

export const noShowClaimStore = {
  remember,
  rememberFromPayload: (input: {
    claimId?: string | null;
    rideId?: string | null;
    bookingId?: string | null;
    kind?: string | null;
  }): void => {
    const claimId = input.claimId?.trim() || '';
    const rideId = input.rideId?.trim() || '';
    if (!claimId || !rideId) {
      return;
    }
    remember({
      claimId,
      rideId,
      bookingId: input.bookingId?.trim() || null,
      kind: input.kind?.trim() || '',
    });
  },
  findForContext,
  getById: (claimId: string): RememberedNoShowClaim | null =>
    byClaimId.get(claimId.trim()) ?? null,
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clear: (): void => {
    if (byClaimId.size === 0) {
      return;
    }
    byClaimId.clear();
    emit();
  },
};
