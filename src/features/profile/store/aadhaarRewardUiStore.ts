import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AADHAAR_REWARD_STORAGE_KEY_PREFIX,
} from '../constants/aadhaar-reward.constants';
import {
  DEFAULT_AADHAAR_REWARD_UI_FLAGS,
  mergeAadhaarRewardUiFlags,
  type AadhaarRewardUiFlags,
} from '../utils/aadhaarReward.utils';

type Listener = (userId: string | null, flags: AadhaarRewardUiFlags) => void;

const listeners = new Set<Listener>();

let activeUserId: string | null = null;
let flags: AadhaarRewardUiFlags = { ...DEFAULT_AADHAAR_REWARD_UI_FLAGS };
let hydratePromise: Promise<AadhaarRewardUiFlags> | null = null;

/** In-memory signal: DigiLocker path reached VERIFIED — host should poll for reward. */
let pendingVerifiedCheck = false;

const storageKey = (userId: string): string =>
  `${AADHAAR_REWARD_STORAGE_KEY_PREFIX}${userId}`;

const notify = (): void => {
  const snapshot = { ...flags };
  const userId = activeUserId;
  listeners.forEach((listener) => listener(userId, snapshot));
};

const persist = async (userId: string, next: AadhaarRewardUiFlags): Promise<void> => {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // UI flags are best-effort; backend remains source of truth for the reward.
  }
};

const read = async (userId: string): Promise<AadhaarRewardUiFlags> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) {
      return { ...DEFAULT_AADHAAR_REWARD_UI_FLAGS };
    }
    return mergeAadhaarRewardUiFlags(JSON.parse(raw) as Partial<AadhaarRewardUiFlags>);
  } catch {
    return { ...DEFAULT_AADHAAR_REWARD_UI_FLAGS };
  }
};

const write = async (
  userId: string,
  updater: (prev: AadhaarRewardUiFlags) => AadhaarRewardUiFlags,
): Promise<AadhaarRewardUiFlags> => {
  const prev =
    activeUserId === userId ? flags : await read(userId);
  const next = updater(prev);
  if (activeUserId === userId) {
    flags = next;
    notify();
  }
  await persist(userId, next);
  return next;
};

export const aadhaarRewardUiStore = {
  getFlags: (): AadhaarRewardUiFlags => ({ ...flags }),
  getActiveUserId: (): string | null => activeUserId,
  consumePendingVerifiedCheck: (): boolean => {
    const value = pendingVerifiedCheck;
    pendingVerifiedCheck = false;
    return value;
  },
  hasPendingVerifiedCheck: (): boolean => pendingVerifiedCheck,

  /** Called from DigiLocker onVerified — does not credit coins. */
  signalAadhaarVerified: (): void => {
    pendingVerifiedCheck = true;
    notify();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    listener(activeUserId, { ...flags });
    return () => listeners.delete(listener);
  },

  hydrateForUser: async (userId: string | null): Promise<AadhaarRewardUiFlags> => {
    if (!userId) {
      activeUserId = null;
      flags = { ...DEFAULT_AADHAAR_REWARD_UI_FLAGS };
      hydratePromise = null;
      notify();
      return flags;
    }

    if (activeUserId === userId && !hydratePromise) {
      return { ...flags };
    }

    activeUserId = userId;
    hydratePromise = read(userId).then((loaded) => {
      if (activeUserId === userId) {
        flags = loaded;
        hydratePromise = null;
        notify();
      }
      return loaded;
    });
    return hydratePromise;
  },

  markClaimEligible: async (userId: string): Promise<void> => {
    const prev = activeUserId === userId ? flags : await read(userId);
    // Reset dismiss so a premature OTP-time dismiss cannot hide the Home claim.
    // Never clear celebrationSeen — that means the reward UX already finished.
    const next: AadhaarRewardUiFlags = {
      ...prev,
      claimEligible: true,
      claimModalDismissed: prev.celebrationSeen ? prev.claimModalDismissed : false,
    };
    await persist(userId, next);
    // Seed eligibility; claim modal is gated to Home after profile setup.
    if (!activeUserId || activeUserId === userId) {
      activeUserId = userId;
      flags = next;
      notify();
    }
  },

  dismissClaimModal: async (userId: string): Promise<void> => {
    await write(userId, (prev) => ({
      ...prev,
      claimModalDismissed: true,
    }));
  },

  markCelebrationSeen: async (userId: string): Promise<void> => {
    await write(userId, (prev) => ({
      ...prev,
      celebrationSeen: true,
      claimModalDismissed: true,
      claimEligible: false,
    }));
  },

  /** Test helper — clears in-memory state only. */
  __resetForTests: (): void => {
    activeUserId = null;
    flags = { ...DEFAULT_AADHAAR_REWARD_UI_FLAGS };
    hydratePromise = null;
    pendingVerifiedCheck = false;
  },
};
