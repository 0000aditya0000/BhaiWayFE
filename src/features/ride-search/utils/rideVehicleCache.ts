/** On-device vehicle snapshot — backend booking responses often omit `vehicle`. */
export interface RideVehicleRecord {
  rideId: string;
  vehicleLabel: string;
  plateNumber?: string;
  make?: string;
  model?: string;
  color?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'bhaiway.rideVehicle.v1';

let memoryCache: Record<string, RideVehicleRecord> = {};
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

const loadStorage = async () => {
  const mod = await import('@react-native-async-storage/async-storage');
  return mod.default;
};

const hydrate = async (): Promise<void> => {
  if (hydrated) {
    return;
  }
  if (hydratePromise) {
    return hydratePromise;
  }
  hydratePromise = (async () => {
    try {
      const AsyncStorage = await loadStorage();
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, RideVehicleRecord>;
        if (parsed && typeof parsed === 'object') {
          memoryCache = parsed;
        }
      }
    } catch {
      memoryCache = {};
    } finally {
      hydrated = true;
      hydratePromise = null;
    }
  })();
  return hydratePromise;
};

const persist = async (): Promise<void> => {
  try {
    const AsyncStorage = await loadStorage();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Non-fatal — memory cache still works for the session.
  }
};

export const rideVehicleCache = {
  hydrate,

  getSync(rideId: string): RideVehicleRecord | null {
    const id = rideId.trim();
    if (!id) {
      return null;
    }
    return memoryCache[id] ?? null;
  },

  async get(rideId: string): Promise<RideVehicleRecord | null> {
    await hydrate();
    return this.getSync(rideId);
  },

  async save(input: {
    rideId: string;
    vehicleLabel: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    color?: string;
  }): Promise<void> {
    const rideId = input.rideId.trim();
    const vehicleLabel = input.vehicleLabel.trim();
    if (!rideId || !vehicleLabel || vehicleLabel === 'Vehicle') {
      return;
    }
    await hydrate();
    memoryCache[rideId] = {
      rideId,
      vehicleLabel,
      plateNumber: input.plateNumber?.trim() || undefined,
      make: input.make?.trim() || undefined,
      model: input.model?.trim() || undefined,
      color: input.color?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    await persist();
  },
};
