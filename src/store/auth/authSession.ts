import type { UserProfile } from '@/features/auth/types';
import type { ApiGender } from '@/features/auth/types';

import { authStorage } from './authStorage';

export interface SessionUser {
  id: string;
  fullName: string;
  /** Preferred greeting name from profile.firstName when available. */
  firstName: string | null;
  email: string | null;
  emailVerified?: boolean;
  avatarUri: string | null;
  phone: string | null;
  /** Canonical gender from GET /users/me profile.gender (Aadhaar-controlled). */
  gender: ApiGender | null;
}

export interface AuthSessionState {
  token: string | null;
  user: SessionUser | null;
  role: string | null;
  profileCompleted: boolean;
  hydrated: boolean;
  deletionPending: boolean;
}

type SessionListener = (state: AuthSessionState) => void;

const state: AuthSessionState = {
  token: null,
  user: null,
  role: null,
  profileCompleted: false,
  hydrated: false,
  deletionPending: false,
};

const listeners = new Set<SessionListener>();

const notify = (): void => {
  listeners.forEach((listener) =>
    listener({
      token: state.token,
      user: state.user ? { ...state.user } : null,
      role: state.role,
      profileCompleted: state.profileCompleted,
      hydrated: state.hydrated,
      deletionPending: state.deletionPending,
    }),
  );
};

const toSessionUser = (
  partial: Partial<SessionUser> & { id: string; fullName: string },
): SessionUser => ({
  id: partial.id,
  fullName: partial.fullName,
  firstName: partial.firstName ?? null,
  email: partial.email ?? null,
  avatarUri: partial.avatarUri ?? null,
  phone: partial.phone ?? null,
  gender: partial.gender ?? null,
});

const persistCurrent = (): void => {
  if (!state.token || !state.user) {
    void authStorage.clear();
    return;
  }
  void authStorage.save({
    token: state.token,
    user: state.user,
    role: state.role,
    deletionPending: state.deletionPending,
  });
};

export const authSession = {
  getToken: (): string | null => state.token,
  getUser: (): SessionUser | null => (state.user ? { ...state.user } : null),
  getRole: (): string | null => state.role,
  getProfileCompleted: (): boolean => state.profileCompleted,
  isHydrated: (): boolean => state.hydrated,
  isAuthenticated: (): boolean => Boolean(state.token && state.user && !state.deletionPending),
  isDeletionPending: (): boolean => Boolean(state.deletionPending),
  hasRestrictedSession: (): boolean => Boolean(state.token && state.deletionPending),

  /** Restore session from AsyncStorage before rendering auth gates. */
  hydrate: async (): Promise<boolean> => {
    const saved = await authStorage.load();
    if (saved) {
      state.token = saved.token;
      state.user = toSessionUser({
        id: saved.user.id,
        fullName: saved.user.fullName,
        firstName: saved.user.firstName ?? null,
        email: saved.user.email,
        avatarUri: saved.user.avatarUri,
        phone: saved.user.phone,
        gender: saved.user.gender ?? null,
      });
      state.role = saved.role ?? null;
      state.deletionPending = Boolean(saved.deletionPending);
    } else {
      state.token = null;
      state.user = null;
      state.role = null;
      state.profileCompleted = false;
      state.deletionPending = false;
    }
    state.hydrated = true;
    notify();
    return Boolean(saved);
  },

  setSession: (
    token: string,
    user: SessionUser,
    role?: string | null,
    profileCompleted?: boolean,
    deletionPending?: boolean,
  ): void => {
    state.token = token;
    state.user = user;
    state.role = role ?? state.role;
    if (profileCompleted !== undefined) {
      state.profileCompleted = profileCompleted;
    }
    state.deletionPending = Boolean(deletionPending);
    state.hydrated = true;
    persistCurrent();
    notify();
  },

  /** Store restricted session for users in DELETION_REQUESTED or DELETION_ACTION_REQUIRED state. */
  setRestrictedDeletionSession: (token: string, user: SessionUser): void => {
    state.token = token;
    state.user = toSessionUser(user);
    state.role = null;
    state.profileCompleted = true;
    state.deletionPending = true;
    state.hydrated = true;
    persistCurrent();
    notify();
  },

  setDeletionPending: (pending: boolean): void => {
    state.deletionPending = pending;
    persistCurrent();
    notify();
  },

  clearDeletionPending: (): void => {
    state.deletionPending = false;
    persistCurrent();
    notify();
  },

  applyServerUser: (user: SessionUser, profileCompleted: boolean): void => {
    state.user = toSessionUser(user);
    state.profileCompleted = profileCompleted;
    persistCurrent();
    notify();
  },

  setUserFromProfile: (profile: UserProfile): void => {
    const [firstName] = profile.fullName.trim().split(/\s+/);
    const genderFromUi =
      profile.gender === 'male'
        ? 'MALE'
        : profile.gender === 'female'
          ? 'FEMALE'
          : profile.gender === 'other'
            ? 'OTHER'
            : null;
    state.user = toSessionUser({
      id: state.user?.id || profile.id,
      fullName: profile.fullName,
      firstName: firstName || null,
      email: profile.email,
      avatarUri: profile.avatarUri,
      phone: state.user?.phone ?? null,
      gender: state.user?.gender ?? genderFromUi,
    });
    state.profileCompleted = true;
    persistCurrent();
    notify();
  },

  clear: (): void => {
    state.token = null;
    state.user = null;
    state.role = null;
    state.profileCompleted = false;
    state.deletionPending = false;
    state.hydrated = true;
    void authStorage.clear();
    notify();
  },

  subscribe: (listener: SessionListener): (() => void) => {
    listeners.add(listener);
    // Replay current state immediately so listeners attached after hydrate
    // (e.g. push registration) do not miss an already-authenticated session.
    listener({
      token: state.token,
      user: state.user ? { ...state.user } : null,
      role: state.role,
      profileCompleted: state.profileCompleted,
      hydrated: state.hydrated,
      deletionPending: state.deletionPending,
    });
    return () => {
      listeners.delete(listener);
    };
  },
};

export const createSessionUser = toSessionUser;
