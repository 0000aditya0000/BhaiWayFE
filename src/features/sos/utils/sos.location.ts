import * as Location from 'expo-location';

export type SosCoordinateSample = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
};

const isValid = (latitude: number, longitude: number): boolean =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  !(latitude === 0 && longitude === 0) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;

export const readSosCoordinate = async (): Promise<SosCoordinateSample | null> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return null;
    }
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return null;
    }
    const last = await Location.getLastKnownPositionAsync();
    if (last && isValid(last.coords.latitude, last.coords.longitude)) {
      const ageMs = Date.now() - last.timestamp;
      if (ageMs <= 30_000) {
        return {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          accuracy:
            typeof last.coords.accuracy === 'number' && Number.isFinite(last.coords.accuracy)
              ? last.coords.accuracy
              : undefined,
          timestamp: new Date(last.timestamp).toISOString(),
        };
      }
    }
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    if (!isValid(current.coords.latitude, current.coords.longitude)) {
      return null;
    }
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      accuracy:
        typeof current.coords.accuracy === 'number' && Number.isFinite(current.coords.accuracy)
          ? current.coords.accuracy
          : undefined,
      timestamp: new Date(current.timestamp || Date.now()).toISOString(),
    };
  } catch {
    return null;
  }
};
