import {
  CURRENT_LOCATION_ALERTS,
  getCurrentDeviceCoordinate,
} from '@/shared/maps';

import { reverseGeocodeCoordinate } from '../services';
import type { SelectedDestination } from '../types';

export type ResolveCurrentPlaceResult =
  | { ok: true; place: SelectedDestination }
  | { ok: false; title: string; message: string };

export const resolveCurrentPlace = async (): Promise<ResolveCurrentPlaceResult> => {
  const gps = await getCurrentDeviceCoordinate();
  if (!gps.ok) {
    const alert = CURRENT_LOCATION_ALERTS[gps.reason];
    return { ok: false, title: alert.title, message: alert.message };
  }

  const destination = await reverseGeocodeCoordinate(gps.coordinate);
  return {
    ok: true,
    place: {
      ...destination,
      placeName: String(destination.placeName ?? '').trim() || 'Current location',
      address:
        String(destination.address ?? '').trim() ||
        String(destination.placeName ?? '').trim() ||
        'Current location',
      latitude: gps.coordinate.latitude,
      longitude: gps.coordinate.longitude,
      boundary: undefined,
    },
  };
};
