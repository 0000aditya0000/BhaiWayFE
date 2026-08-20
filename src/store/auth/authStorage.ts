import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEY = '@bhaiway/auth-session';

export interface PersistedAuthSession {
  token: string;
  user: {
    id: string;
    fullName: string;
    firstName?: string | null;
    email: string | null;
    avatarUri: string | null;
    phone: string | null;
  };
  role?: string | null;
}

const isSessionUser = (value: unknown): value is PersistedAuthSession['user'] => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const user = value as PersistedAuthSession['user'];
  return typeof user.id === 'string' && typeof user.fullName === 'string';
};

export const authStorage = {
  load: async (): Promise<PersistedAuthSession | null> => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<PersistedAuthSession>;
      if (typeof parsed.token !== 'string' || !parsed.token || !isSessionUser(parsed.user)) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return {
        token: parsed.token,
        user: {
          id: parsed.user.id,
          fullName: parsed.user.fullName ?? '',
          firstName: parsed.user.firstName ?? null,
          email: parsed.user.email ?? null,
          avatarUri: parsed.user.avatarUri ?? null,
          phone: parsed.user.phone ?? null,
        },
        role: parsed.role ?? null,
      };
    } catch {
      return null;
    }
  },

  save: async (session: PersistedAuthSession): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('[authStorage] save failed', error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.warn('[authStorage] clear failed', error);
    }
  },
};
