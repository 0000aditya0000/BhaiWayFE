import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@bhaiway/fcm-device-token';
const DEVICE_ID_KEY = '@bhaiway/push-device-id';

let memoryToken: string | null = null;
let memoryDeviceId: string | null = null;

const createStableId = (): string => {
  const cryptoObj = globalThis.crypto as
    | { randomUUID?: () => string; getRandomValues?: (arr: Uint8Array) => Uint8Array }
    | undefined;
  if (typeof cryptoObj?.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof cryptoObj?.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const pushTokenStorage = {
  getToken: async (): Promise<string | null> => {
    if (memoryToken) {
      return memoryToken;
    }
    try {
      memoryToken = (await AsyncStorage.getItem(FCM_TOKEN_KEY))?.trim() || null;
    } catch {
      memoryToken = null;
    }
    return memoryToken;
  },

  setToken: async (token: string): Promise<void> => {
    memoryToken = token.trim() || null;
    if (!memoryToken) {
      try {
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      } catch {
        // ignore
      }
      return;
    }
    try {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, memoryToken);
    } catch {
      // keep memory
    }
  },

  clearToken: async (): Promise<void> => {
    memoryToken = null;
    try {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  getOrCreateDeviceId: async (): Promise<string> => {
    if (memoryDeviceId) {
      return memoryDeviceId;
    }
    try {
      const existing = (await AsyncStorage.getItem(DEVICE_ID_KEY))?.trim();
      if (existing) {
        memoryDeviceId = existing;
        return existing;
      }
    } catch {
      // fall through
    }
    const created = createStableId();
    memoryDeviceId = created;
    try {
      await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    } catch {
      // keep memory
    }
    return created;
  },
};
