import type { SosRecord, SosStatus } from '../api/sos.types';
import { isActiveSosStatus } from '../api/sos.unwrap';
import { isTerminalSosStatus } from '../utils/sos.policy';

export interface SosUiState {
  rideId: string | null;
  sosId: string | null;
  status: SosStatus | null;
  category: string | null;
  triggeredAt: string | null;
  triggererName: string | null;
  triggererUserId: string | null;
  attachedToExisting: boolean;
  currentUserTriggered: boolean;
  driverAlertVisible: boolean;
  driverAlertSosId: string | null;
  driverAlertStartedAt: number | null;
  soundPlaying: boolean;
  locationPublishing: boolean;
  lastError: string | null;
  seenAlertSosIds: string[];
  seenSoundSosIds: string[];
  seenPassengerAlertSosIds: string[];
}

type Listener = (state: SosUiState) => void;

const initialState: SosUiState = {
  rideId: null,
  sosId: null,
  status: null,
  category: null,
  triggeredAt: null,
  triggererName: null,
  triggererUserId: null,
  attachedToExisting: false,
  currentUserTriggered: false,
  driverAlertVisible: false,
  driverAlertSosId: null,
  driverAlertStartedAt: null,
  soundPlaying: false,
  locationPublishing: false,
  lastError: null,
  seenAlertSosIds: [],
  seenSoundSosIds: [],
  seenPassengerAlertSosIds: [],
};

let state: SosUiState = { ...initialState, seenAlertSosIds: [], seenSoundSosIds: [], seenPassengerAlertSosIds: [] };
const listeners = new Set<Listener>();

const remember = (list: string[], id: string): string[] => {
  const value = id.trim();
  if (!value || list.includes(value)) {
    return list;
  }
  return [...list, value].slice(-40);
};

const notify = (): void => {
  const snapshot = sosStore.get();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore
    }
  });
};

const setState = (partial: Partial<SosUiState>): void => {
  state = { ...state, ...partial };
  notify();
};

export const sosStore = {
  get: (): SosUiState => ({
    ...state,
    seenAlertSosIds: [...state.seenAlertSosIds],
    seenSoundSosIds: [...state.seenSoundSosIds],
    seenPassengerAlertSosIds: [...state.seenPassengerAlertSosIds],
  }),

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    listener(sosStore.get());
    return () => {
      listeners.delete(listener);
    };
  },

  applyRecord: (
    record: SosRecord,
    options?: { currentUserTriggered?: boolean },
  ): void => {
    const terminal = isTerminalSosStatus(record.status);
    const hasActive = Boolean(state.sosId && state.rideId && isActiveSosStatus(state.status));

    if (hasActive && record.rideId !== state.rideId) {
      return;
    }

    if (terminal) {
      if (state.sosId && record.id !== state.sosId) {
        return;
      }
      setState({
        rideId: null,
        sosId: null,
        status: record.status,
        category: record.category,
        triggeredAt: null,
        triggererName: null,
        triggererUserId: null,
        attachedToExisting: false,
        currentUserTriggered: false,
        driverAlertVisible: false,
        driverAlertSosId: null,
        driverAlertStartedAt: null,
        soundPlaying: false,
        locationPublishing: false,
        lastError: null,
      });
      return;
    }

    setState({
      rideId: record.rideId,
      sosId: record.id,
      status: record.status,
      category: record.category,
      triggeredAt: record.triggeredAt,
      triggererName: state.triggererName || record.triggerer?.name || null,
      triggererUserId: state.triggererUserId || record.triggerer?.userId || null,
      attachedToExisting: record.attachedToExisting || state.attachedToExisting,
      currentUserTriggered: options?.currentUserTriggered ?? state.currentUserTriggered,
      lastError: null,
    });
  },

  markCurrentUserTriggered: (): void => {
    setState({ currentUserTriggered: true });
  },

  presentDriverAlert: (sosId: string): void => {
    const id = sosId.trim();
    if (!id) {
      return;
    }
    setState({
      driverAlertVisible: true,
      driverAlertSosId: id,
      driverAlertStartedAt: Date.now(),
      seenAlertSosIds: remember(state.seenAlertSosIds, id),
    });
  },

  dismissDriverAlert: (sosId?: string): void => {
    if (sosId && state.driverAlertSosId && sosId !== state.driverAlertSosId) {
      return;
    }
    setState({
      driverAlertVisible: false,
      driverAlertSosId: null,
      driverAlertStartedAt: null,
      soundPlaying: false,
    });
  },

  markSoundPlayed: (sosId: string): void => {
    setState({
      soundPlaying: true,
      seenSoundSosIds: remember(state.seenSoundSosIds, sosId),
    });
  },

  stopSound: (): void => {
    if (!state.soundPlaying) {
      return;
    }
    setState({ soundPlaying: false });
  },

  markPassengerAlerted: (sosId: string): void => {
    setState({
      seenPassengerAlertSosIds: remember(state.seenPassengerAlertSosIds, sosId),
    });
  },

  setLocationPublishing: (locationPublishing: boolean): void => {
    if (state.locationPublishing === locationPublishing) {
      return;
    }
    setState({ locationPublishing });
  },

  setLastError: (lastError: string | null): void => {
    setState({ lastError });
  },

  hasSeenAlert: (sosId: string): boolean => state.seenAlertSosIds.includes(sosId.trim()),
  hasSeenSound: (sosId: string): boolean => state.seenSoundSosIds.includes(sosId.trim()),
  hasSeenPassengerAlert: (sosId: string): boolean =>
    state.seenPassengerAlertSosIds.includes(sosId.trim()),

  reset: (): void => {
    state = {
      ...initialState,
      seenAlertSosIds: [],
      seenSoundSosIds: [],
      seenPassengerAlertSosIds: [],
    };
    notify();
  },
};
